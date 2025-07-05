# UK Capital Gains Tax Calculator - Enhancement Tasks

## Overview

This document outlines the comprehensive enhancements needed to transform the current basic capital gains calculator into a full-featured tax calculation and portfolio management system. The enhancements are based on analysis of the Sharesight.csv data which contains rich transaction data including dividends, currency exchanges, commissions, and multiple asset classes.

## Current System Limitations

1. **Only processes stock buy/sell transactions** - Ignores dividends, currency exchanges, fees
2. **Missing transaction types** - No support for FX gains/losses, dividend income, commissions
3. **Incomplete cost basis calculation** - Doesn't include all allowable costs
4. **No portfolio view** - Only shows disposed positions, not current holdings
5. **No market grouping** - Doesn't utilize exchange/market data for organization
6. **No performance metrics** - Missing dividend yields, currency effects, total returns

---

## PHASE 1: Enhanced Transaction Processing Foundation

### Task 1.1: Expand Transaction Type Enumeration
**File:** `src/main/python/models/domain_models.py`

**Description:**
Expand the `TransactionType` enum to support all transaction types found in Sharesight data.

**Current State:**
```python
class TransactionType(Enum):
    BUY = "BUY"
    SELL = "SELL"
    DIVIDEND = "DIV"
    SPLIT = "SPLIT"
    MERGER = "MERGER"
    FEE = "FEE"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
```

**Required Changes:**
```python
class TransactionType(Enum):
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
```

**Implementation Details:**
- Add new enum values for currency exchanges, interest, commissions
- Update all switch/match statements that use TransactionType
- Add validation logic for each transaction type
- Update transaction factory methods to handle new types

**Test Requirements:**
- Unit tests for each new transaction type
- Validation tests for transaction type combinations
- Integration tests with CSV parser

---

### Task 1.2: Enhanced Asset Class Support
**File:** `src/main/python/models/domain_models.py`

**Description:**
Add support for different asset classes beyond just stocks (STK).

**New Domain Model:**
```python
class AssetClass(Enum):
    STOCK = "STK"
    ETF = "ETF"
    CLOSED_END_FUND = "CLOSED-END FUND"
    CASH = "CASH"
    BOND = "BOND"
    OPTION = "OPT"
    FUTURE = "FUT"

@dataclass
class Security:
    # ... existing fields ...
    asset_class: AssetClass = AssetClass.STOCK
    sub_category: Optional[str] = None  # COMMON, PREFERRED, etc.
    listing_exchange: Optional[str] = None  # LSE, NASDAQ, NYSE, etc.
    trading_exchange: Optional[str] = None  # Actual trading venue
```

**Implementation Details:**
- Add AssetClass enum with all types from Sharesight data
- Update Security model to include asset_class, sub_category, listing_exchange
- Add validation logic for asset class combinations
- Update security factory to set asset class from CSV data

**Test Requirements:**
- Unit tests for each asset class
- Validation tests for asset class/sub-category combinations
- Integration tests with real Sharesight data

---

### Task 1.3: Enhanced CSV Parser for All Transaction Types
**File:** `src/main/python/parsers/csv_parser.py`

**Description:**
Enhance the CSV parser to handle all transaction types and fields from Sharesight data.

**Current Limitations:**
- Only processes stock buy/sell transactions
- Ignores currency exchange transactions
- Doesn't capture commission/tax data properly
- Missing dividend processing

**Required Enhancements:**

1. **Transaction Type Mapping:**
```python
def _map_transaction_type(self, row: Dict[str, Any]) -> TransactionType:
    """Map Sharesight transaction data to internal transaction types."""
    asset_class = row.get('AssetClass', '')
    buy_sell = row.get('Buy/Sell', '')
    
    if asset_class == 'CASH':
        return TransactionType.CURRENCY_EXCHANGE
    elif buy_sell in ['BUY', 'SELL']:
        return TransactionType.BUY if buy_sell == 'BUY' else TransactionType.SELL
    elif 'DIV' in row.get('TransactionType', ''):
        return TransactionType.DIVIDEND
    # ... additional mappings
```

2. **Enhanced Field Extraction:**
```python
def _extract_enhanced_fields(self, row: Dict[str, Any]) -> Dict[str, Any]:
    """Extract all relevant fields from Sharesight CSV row."""
    return {
        'asset_class': row.get('AssetClass'),
        'sub_category': row.get('SubCategory'),
        'listing_exchange': row.get('ListingExchange'),
        'trading_exchange': row.get('Exchange'),
        'commission': float(row.get('IBCommission', 0)),
        'taxes': float(row.get('Taxes', 0)),
        'close_price': float(row.get('ClosePrice', 0)),
        'mtm_pnl': float(row.get('MtmPnl', 0)),
        'fifo_pnl_realized': float(row.get('FifoPnlRealized', 0)),
        # ... additional fields
    }
```

3. **Currency Exchange Processing:**
```python
def _process_currency_transaction(self, row: Dict[str, Any]) -> Transaction:
    """Process currency exchange transactions for FX gain/loss calculation."""
    # Extract currency pair (e.g., "EUR.GBP")
    symbol = row.get('Symbol', '')
    currencies = symbol.split('.')
    
    # Calculate FX gain/loss
    fx_rate = float(row.get('FXRateToBase', 1.0))
    quantity = float(row.get('Quantity', 0))
    
    # Create FX transaction
    return Transaction(
        transaction_type=TransactionType.CURRENCY_EXCHANGE,
        # ... additional fields
    )
```

**Implementation Details:**
- Add comprehensive field mapping from Sharesight CSV columns
- Implement transaction type detection logic
- Add currency exchange transaction processing
- Add dividend transaction processing
- Include all fees and commissions in cost basis calculations
- Handle different asset classes appropriately

**Test Requirements:**
- Unit tests for each transaction type parsing
- Integration tests with real Sharesight CSV data
- Edge case tests for malformed data
- Performance tests with large CSV files

---

## PHASE 2: Dividend Income Processing

### Task 2.1: Dividend Income Domain Models
**File:** `src/main/python/models/domain_models.py`

**Description:**
Create domain models for dividend income tracking and tax calculation.

**New Domain Models:**
```python
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
```

**Implementation Details:**
- Create comprehensive dividend income model
- Include foreign currency handling
- Add withholding tax calculations
- Support different dividend types
- Add summary calculations

**Test Requirements:**
- Unit tests for dividend calculations
- Currency conversion tests
- Withholding tax calculation tests
- Summary aggregation tests

---

### Task 2.2: Dividend Processing Service
**File:** `src/main/python/services/dividend_processor.py`

**Description:**
Create a service to process dividend transactions and calculate tax implications.

**New Service Class:**
```python
class DividendProcessor:
    """Service for processing dividend income transactions."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def process_dividend_transactions(
        self, 
        transactions: List[Transaction]
    ) -> List[DividendIncome]:
        """Process dividend transactions into dividend income records."""
        dividend_transactions = [
            t for t in transactions 
            if t.transaction_type == TransactionType.DIVIDEND
        ]
        
        dividends = []
        for transaction in dividend_transactions:
            dividend = self._create_dividend_from_transaction(transaction)
            dividends.append(dividend)
        
        return dividends
    
    def _create_dividend_from_transaction(
        self, 
        transaction: Transaction
    ) -> DividendIncome:
        """Convert a dividend transaction to dividend income."""
        # Extract dividend-specific data
        amount_foreign = abs(transaction.quantity * transaction.price_per_unit)
        amount_gbp = transaction.net_amount_in_base_currency
        withholding_tax = transaction.taxes_in_base_currency
        
        return DividendIncome(
            security=transaction.security,
            payment_date=transaction.date,
            amount_foreign_currency=amount_foreign,
            foreign_currency=transaction.currency,
            amount_gbp=amount_gbp,
            withholding_tax_gbp=withholding_tax
        )
    
    def calculate_dividend_summary(
        self, 
        dividends: List[DividendIncome], 
        tax_year: str
    ) -> DividendSummary:
        """Calculate dividend summary for a tax year."""
        summary = DividendSummary(tax_year=tax_year)
        
        for dividend in dividends:
            if self._is_in_tax_year(dividend.payment_date, tax_year):
                summary.add_dividend(dividend)
        
        return summary
    
    def _is_in_tax_year(self, date: datetime, tax_year: str) -> bool:
        """Check if a date falls within the specified UK tax year."""
        # UK tax year runs April 6 to April 5
        year_parts = tax_year.split('-')
        start_year = int(year_parts[0])
        
        tax_year_start = datetime(start_year, 4, 6)
        tax_year_end = datetime(start_year + 1, 4, 5)
        
        return tax_year_start <= date <= tax_year_end
```

**Implementation Details:**
- Process dividend transactions from parsed CSV data
- Handle foreign currency dividends with proper conversion
- Calculate withholding tax implications
- Group dividends by tax year
- Generate dividend income summaries

**Test Requirements:**
- Unit tests for dividend processing logic
- Integration tests with real dividend data
- Tax year boundary tests
- Currency conversion accuracy tests

---

## PHASE 3: Currency Exchange Gain/Loss Processing

### Task 3.1: Currency Exchange Domain Models
**File:** `src/main/python/models/domain_models.py`

**Description:**
Create domain models for tracking currency exchange gains and losses.

**New Domain Models:**
```python
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
        return f"{self.from_currency.code}.{self.to_currency.code}"

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
    
    @property
    def is_gain(self) -> bool:
        """Check if this is a gain (positive) or loss (negative)."""
        return self.gain_loss_gbp > 0

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
```

**Implementation Details:**
- Model currency exchange transactions
- Track exchange rates and gain/loss calculations
- Support multiple currency pairs
- Aggregate gains and losses by tax year

**Test Requirements:**
- Unit tests for currency exchange calculations
- Exchange rate accuracy tests
- Gain/loss calculation verification
- Summary aggregation tests

---

### Task 3.2: Currency Exchange Processing Service
**File:** `src/main/python/services/currency_processor.py`

**Description:**
Create a service to process currency exchange transactions and calculate taxable gains/losses.

**New Service Class:**
```python
class CurrencyExchangeProcessor:
    """Service for processing currency exchange transactions."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def process_currency_transactions(
        self, 
        transactions: List[Transaction]
    ) -> List[CurrencyGainLoss]:
        """Process currency exchange transactions for tax purposes."""
        fx_transactions = [
            t for t in transactions 
            if t.transaction_type == TransactionType.CURRENCY_EXCHANGE
        ]
        
        currency_gains_losses = []
        
        # Group transactions by currency pair
        currency_pairs = self._group_by_currency_pair(fx_transactions)
        
        for pair, pair_transactions in currency_pairs.items():
            gains_losses = self._calculate_currency_gains_losses(
                pair, pair_transactions
            )
            currency_gains_losses.extend(gains_losses)
        
        return currency_gains_losses
    
    def _group_by_currency_pair(
        self, 
        transactions: List[Transaction]
    ) -> Dict[str, List[Transaction]]:
        """Group currency transactions by currency pair."""
        pairs = {}
        
        for transaction in transactions:
            # Extract currency pair from security symbol (e.g., "EUR.GBP")
            pair = transaction.security.symbol
            if pair not in pairs:
                pairs[pair] = []
            pairs[pair].append(transaction)
        
        return pairs
    
    def _calculate_currency_gains_losses(
        self, 
        currency_pair: str, 
        transactions: List[Transaction]
    ) -> List[CurrencyGainLoss]:
        """Calculate gains/losses for a specific currency pair."""
        gains_losses = []
        
        # Sort transactions by date
        sorted_transactions = sorted(transactions, key=lambda t: t.date)
        
        # Track currency position using FIFO
        currency_pool = []
        
        for transaction in sorted_transactions:
            if transaction.quantity > 0:  # Buying foreign currency
                currency_pool.append({
                    'quantity': transaction.quantity,
                    'rate': transaction.currency.rate_to_base,
                    'date': transaction.date
                })
            else:  # Selling foreign currency
                gain_loss = self._calculate_disposal_gain_loss(
                    currency_pool, 
                    abs(transaction.quantity),
                    transaction.currency.rate_to_base,
                    transaction.date,
                    currency_pair
                )
                if gain_loss:
                    gains_losses.append(gain_loss)
        
        return gains_losses
    
    def _calculate_disposal_gain_loss(
        self, 
        currency_pool: List[Dict], 
        quantity_sold: float,
        current_rate: float,
        disposal_date: datetime,
        currency_pair: str
    ) -> Optional[CurrencyGainLoss]:
        """Calculate gain/loss on currency disposal using FIFO."""
        if not currency_pool:
            return None
        
        total_cost = 0.0
        remaining_quantity = quantity_sold
        
        while remaining_quantity > 0 and currency_pool:
            pool_entry = currency_pool[0]
            
            if pool_entry['quantity'] <= remaining_quantity:
                # Use entire pool entry
                cost = pool_entry['quantity'] / pool_entry['rate']
                total_cost += cost
                remaining_quantity -= pool_entry['quantity']
                currency_pool.pop(0)
            else:
                # Use partial pool entry
                cost = remaining_quantity / pool_entry['rate']
                total_cost += cost
                pool_entry['quantity'] -= remaining_quantity
                remaining_quantity = 0
        
        # Calculate gain/loss
        proceeds = quantity_sold / current_rate
        gain_loss = proceeds - total_cost
        
        return CurrencyGainLoss(
            currency_pair=currency_pair,
            transaction_date=disposal_date,
            amount_gbp=proceeds,
            gain_loss_gbp=gain_loss,
            exchange_rate_used=current_rate
        )
```

**Implementation Details:**
- Process currency exchange transactions from CSV data
- Implement FIFO matching for currency disposals
- Calculate taxable gains/losses on currency exchanges
- Handle multiple currency pairs
- Track currency positions over time

**Test Requirements:**
- Unit tests for FIFO currency matching
- Gain/loss calculation accuracy tests
- Multiple currency pair handling tests
- Integration tests with real FX data

---

## PHASE 4: Comprehensive Tax Calculation Enhancement

### Task 4.1: Enhanced Tax Year Calculator
**File:** `src/main/python/services/tax_year_calculator.py`

**Description:**
Enhance the existing tax year calculator to include dividends, currency gains, and comprehensive cost basis calculations.

**Enhanced Tax Year Calculator:**
```python
class EnhancedTaxYearCalculator:
    """Enhanced tax year calculator including all income types."""
    
    def __init__(
        self,
        disposal_calculator: DisposalCalculator,
        dividend_processor: DividendProcessor,
        currency_processor: CurrencyExchangeProcessor
    ):
        self.disposal_calculator = disposal_calculator
        self.dividend_processor = dividend_processor
        self.currency_processor = currency_processor
        self.logger = logging.getLogger(__name__)
    
    def calculate_comprehensive_tax_summary(
        self, 
        transactions: List[Transaction], 
        tax_year: str
    ) -> ComprehensiveTaxSummary:
        """Calculate comprehensive tax summary including all income types."""
        
        # Calculate capital gains (existing functionality)
        capital_gains_summary = self._calculate_capital_gains(
            transactions, tax_year
        )
        
        # Calculate dividend income
        dividend_summary = self.dividend_processor.calculate_dividend_summary(
            self.dividend_processor.process_dividend_transactions(transactions),
            tax_year
        )
        
        # Calculate currency gains/losses
        currency_summary = self._calculate_currency_summary(
            self.currency_processor.process_currency_transactions(transactions),
            tax_year
        )
        
        # Calculate total allowable costs
        total_costs = self._calculate_total_allowable_costs(transactions)
        
        return ComprehensiveTaxSummary(
            tax_year=tax_year,
            capital_gains=capital_gains_summary,
            dividend_income=dividend_summary,
            currency_gains=currency_summary,
            total_allowable_costs=total_costs,
            total_taxable_income=self._calculate_total_taxable_income(
                capital_gains_summary, dividend_summary, currency_summary
            )
        )
    
    def _calculate_total_allowable_costs(
        self, 
        transactions: List[Transaction]
    ) -> float:
        """Calculate total allowable costs including all fees and commissions."""
        total_costs = 0.0
        
        for transaction in transactions:
            # Include commissions
            total_costs += transaction.commission_in_base_currency
            
            # Include taxes (where allowable)
            total_costs += transaction.taxes_in_base_currency
            
            # Include other allowable costs
            # (stamp duty, transfer fees, etc.)
        
        return total_costs
    
    def _calculate_total_taxable_income(
        self,
        capital_gains: TaxYearSummary,
        dividends: DividendSummary,
        currency_gains: CurrencyGainLossSummary
    ) -> float:
        """Calculate total taxable income from all sources."""
        return (
            max(0, capital_gains.taxable_gain) +
            dividends.total_net_gbp +
            max(0, currency_gains.net_gain_loss)
        )
```

**Implementation Details:**
- Integrate all income types into single tax calculation
- Include comprehensive cost basis calculations
- Handle different tax treatments for different income types
- Generate unified tax summary

**Test Requirements:**
- Integration tests with all income types
- Tax calculation accuracy tests
- Cost basis inclusion verification
- Comprehensive tax summary tests

---

### Task 4.2: Comprehensive Tax Summary Domain Model
**File:** `src/main/python/models/domain_models.py`

**Description:**
Create a comprehensive tax summary model that includes all income types.

**New Domain Model:**
```python
@dataclass
class ComprehensiveTaxSummary:
    """Comprehensive tax summary including all income types."""
    tax_year: str
    capital_gains: TaxYearSummary = None
    dividend_income: DividendSummary = None
    currency_gains: CurrencyGainLossSummary = None
    total_allowable_costs: float = 0.0
    total_taxable_income: float = 0.0
    
    # Additional tax calculations
    dividend_allowance_used: float = 0.0  # UK dividend allowance
    capital_gains_allowance_used: float = 0.0  # UK CGT allowance
    currency_gains_allowance_used: float = 0.0  # If applicable
    
    @property
    def total_tax_liability(self) -> float:
        """Calculate estimated total tax liability."""
        # This would include CGT, dividend tax, etc.
        # Implementation depends on current UK tax rates
        pass
    
    @property
    def summary_by_income_type(self) -> Dict[str, float]:
        """Get summary breakdown by income type."""
        return {
            'capital_gains': self.capital_gains.taxable_gain if self.capital_gains else 0.0,
            'dividend_income': self.dividend_income.total_net_gbp if self.dividend_income else 0.0,
            'currency_gains': max(0, self.currency_gains.net_gain_loss) if self.currency_gains else 0.0,
            'total_allowable_costs': self.total_allowable_costs
        }
```

**Implementation Details:**
- Comprehensive model including all income types
- Tax allowance tracking
- Summary calculations and breakdowns
- Extensible for future income types

**Test Requirements:**
- Unit tests for all calculations
- Tax allowance application tests
- Summary breakdown verification
- Integration with tax year calculator

---

## PHASE 5: Portfolio Holdings and Performance Analytics

### Task 5.1: Portfolio Holdings Calculator
**File:** `src/main/python/services/portfolio_calculator.py`

**Description:**
Create a service to calculate current portfolio holdings from transaction history.

**New Service Class:**
```python
class PortfolioCalculator:
    """Service for calculating current portfolio holdings and performance."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_current_holdings(
        self, 
        transactions: List[Transaction]
    ) -> List[Holding]:
        """Calculate current holdings from transaction history."""
        holdings_map = {}
        
        # Group transactions by security
        security_transactions = self._group_by_security(transactions)
        
        for security_id, security_txns in security_transactions.items():
            holding = self._calculate_security_holding(security_txns)
            if holding and holding.quantity > 0:
                holdings_map[security_id] = holding
        
        return list(holdings_map.values())
    
    def _calculate_security_holding(
        self, 
        transactions: List[Transaction]
    ) -> Optional[Holding]:
        """Calculate holding for a specific security."""
        if not transactions:
            return None
        
        security = transactions[0].security
        total_quantity = 0.0
        total_cost_gbp = 0.0
        
        # Calculate current position
        for transaction in transactions:
            if transaction.transaction_type == TransactionType.BUY:
                total_quantity += transaction.quantity
                total_cost_gbp += transaction.total_cost_in_base_currency
            elif transaction.transaction_type == TransactionType.SELL:
                # For current holdings, we need to track what's left
                # This requires more sophisticated position tracking
                pass
        
        if total_quantity <= 0:
            return None
        
        # Get current price (from latest transaction or external source)
        current_price = self._get_current_price(security, transactions)
        current_value_gbp = total_quantity * current_price * security.currency.rate_to_base
        
        return Holding(
            security=security,
            quantity=total_quantity,
            average_cost_gbp=total_cost_gbp / total_quantity,
            current_price=current_price,
            current_value_gbp=current_value_gbp,
            market=security.listing_exchange,
            unrealized_gain_loss=current_value_gbp - total_cost_gbp
        )
    
    def group_holdings_by_market(
        self, 
        holdings: List[Holding]
    ) -> Dict[str, List[Holding]]:
        """Group holdings by market/exchange."""
        market_groups = {}
        
        for holding in holdings:
            market = holding.market or "UNKNOWN"
            if market not in market_groups:
                market_groups[market] = []
            market_groups[market].append(holding)
        
        return market_groups
    
    def calculate_market_totals(
        self, 
        market_holdings: Dict[str, List[Holding]]
    ) -> Dict[str, MarketSummary]:
        """Calculate totals for each market."""
        market_summaries = {}
        
        for market, holdings in market_holdings.items():
            summary = MarketSummary(
                market_name=market,
                holdings=holdings,
                total_value=sum(h.current_value_gbp for h in holdings),
                total_cost=sum(h.average_cost_gbp * h.quantity for h in holdings),
                total_unrealized_gain_loss=sum(h.unrealized_gain_loss for h in holdings)
            )
            market_summaries[market] = summary
        
        return market_summaries
```

**Implementation Details:**
- Calculate current holdings from transaction history
- Handle buy/sell position tracking
- Group holdings by market/exchange
- Calculate market-level summaries
- Support multiple asset classes

**Test Requirements:**
- Unit tests for position calculations
- Buy/sell matching accuracy tests
- Market grouping verification
- Integration tests with real transaction data

---

### Task 5.2: Portfolio Holdings Domain Models
**File:** `src/main/python/models/domain_models.py`

**Description:**
Create domain models for portfolio holdings and performance metrics.

**New Domain Models:**
```python
@dataclass
class Holding:
    """Represents a current portfolio holding."""
    id: UUID = field(default_factory=uuid4)
    security: Security = None
    quantity: float = 0.0
    average_cost_gbp: float = 0.0  # Average cost per share in GBP
    current_price: float = 0.0  # Current price in original currency
    current_value_gbp: float = 0.0  # Current value in GBP
    market: str = ""  # LSE, NASDAQ, etc.
    unrealized_gain_loss: float = 0.0
    
    # Performance metrics
    capital_gains_pct: float = 0.0
    dividend_yield_pct: float = 0.0
    currency_effect_pct: float = 0.0
    total_return_pct: float = 0.0
    
    @property
    def total_cost_gbp(self) -> float:
        """Total cost of holding in GBP."""
        return self.average_cost_gbp * self.quantity
    
    @property
    def unrealized_gain_loss_pct(self) -> float:
        """Unrealized gain/loss as percentage."""
        if self.total_cost_gbp > 0:
            return (self.unrealized_gain_loss / self.total_cost_gbp) * 100
        return 0.0

@dataclass
class MarketSummary:
    """Summary of holdings for a specific market."""
    market_name: str
    holdings: List[Holding] = field(default_factory=list)
    total_value: float = 0.0
    total_cost: float = 0.0
    total_unrealized_gain_loss: float = 0.0
    
    @property
    def total_return_pct(self) -> float:
        """Total return percentage for the market."""
        if self.total_cost > 0:
            return (self.total_unrealized_gain_loss / self.total_cost) * 100
        return 0.0
    
    @property
    def weight_in_portfolio(self) -> float:
        """Weight of this market in total portfolio (to be set externally)."""
        return 0.0

@dataclass
class PortfolioSummary:
    """Complete portfolio summary."""
    as_of_date: datetime = field(default_factory=datetime.now)
    market_summaries: Dict[str, MarketSummary] = field(default_factory=dict)
    total_portfolio_value: float = 0.0
    total_portfolio_cost: float = 0.0
    total_unrealized_gain_loss: float = 0.0
    
    @property
    def total_return_pct(self) -> float:
        """Total portfolio return percentage."""
        if self.total_portfolio_cost > 0:
            return (self.total_unrealized_gain_loss / self.total_portfolio_cost) * 100
        return 0.0
    
    @property
    def number_of_holdings(self) -> int:
        """Total number of holdings across all markets."""
        return sum(len(summary.holdings) for summary in self.market_summaries.values())
```

**Implementation Details:**
- Calculate current holdings from transaction history
- Handle buy/sell position tracking with proper FIFO/Section 104 rules
- Group holdings by market/exchange
- Calculate performance metrics for each holding
- Support multiple asset classes and currencies

**Test Requirements:**
- Unit tests for position calculations
- Buy/sell matching accuracy tests
- Market grouping verification
- Performance metrics calculation tests
- Integration tests with real transaction data

---

### Task 5.3: Performance Metrics Calculator
**File:** `src/main/python/services/performance_calculator.py`

**Description:**
Create a service to calculate performance metrics for portfolio holdings.

**New Service Class:**
```python
class PerformanceCalculator:
    """Service for calculating portfolio performance metrics."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_holding_performance(
        self, 
        holding: Holding, 
        transactions: List[Transaction],
        dividends: List[DividendIncome]
    ) -> Holding:
        """Calculate comprehensive performance metrics for a holding."""
        
        # Calculate capital gains percentage
        holding.capital_gains_pct = self._calculate_capital_gains_pct(holding)
        
        # Calculate dividend yield
        holding.dividend_yield_pct = self._calculate_dividend_yield(
            holding, dividends
        )
        
        # Calculate currency effect
        holding.currency_effect_pct = self._calculate_currency_effect(
            holding, transactions
        )
        
        # Calculate total return
        holding.total_return_pct = self._calculate_total_return(holding)
        
        return holding
    
    def _calculate_capital_gains_pct(self, holding: Holding) -> float:
        """Calculate capital gains percentage."""
        if holding.total_cost_gbp > 0:
            return (holding.unrealized_gain_loss / holding.total_cost_gbp) * 100
        return 0.0
    
    def _calculate_dividend_yield(
        self, 
        holding: Holding, 
        dividends: List[DividendIncome]
    ) -> float:
        """Calculate dividend yield percentage."""
        # Filter dividends for this security
        security_dividends = [
            d for d in dividends 
            if d.security.isin == holding.security.isin
        ]
        
        if not security_dividends or holding.current_value_gbp == 0:
            return 0.0
        
        # Calculate annual dividend yield
        total_dividends = sum(d.net_dividend_gbp for d in security_dividends)
        return (total_dividends / holding.current_value_gbp) * 100
    
    def _calculate_currency_effect(
        self, 
        holding: Holding, 
        transactions: List[Transaction]
    ) -> float:
        """Calculate currency effect on returns."""
        # This would compare returns in original currency vs GBP
        # Implementation depends on tracking original currency performance
        return 0.0  # Placeholder
    
    def _calculate_total_return(self, holding: Holding) -> float:
        """Calculate total return including capital gains and dividends."""
        return holding.capital_gains_pct + holding.dividend_yield_pct
```

**Implementation Details:**
- Calculate capital gains percentages
- Calculate dividend yields based on current value
- Calculate currency effects on returns
- Calculate total returns combining all factors
- Support annualized return calculations

**Test Requirements:**
- Unit tests for each performance metric
- Accuracy tests with known data
- Edge case handling (zero values, negative returns)
- Integration tests with real portfolio data

---

## PHASE 6: Enhanced Reporting and Web Interface

### Task 6.1: Portfolio Report Generator
**File:** `src/main/python/services/portfolio_report_generator.py`

**Description:**
Create a comprehensive report generator for portfolio views matching the desired output format.

**New Service Class:**
```python
class PortfolioReportGenerator:
    """Service for generating portfolio reports."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_market_grouped_report(
        self, 
        portfolio_summary: PortfolioSummary
    ) -> Dict[str, Any]:
        """Generate market-grouped portfolio report."""
        
        report = {
            'as_of_date': portfolio_summary.as_of_date,
            'markets': {},
            'grand_total': {
                'total_value': portfolio_summary.total_portfolio_value,
                'total_cost': portfolio_summary.total_portfolio_cost,
                'total_return_pct': portfolio_summary.total_return_pct,
                'number_of_holdings': portfolio_summary.number_of_holdings
            }
        }
        
        for market_name, market_summary in portfolio_summary.market_summaries.items():
            market_data = {
                'market_name': market_name,
                'holdings': [],
                'totals': {
                    'total_value': market_summary.total_value,
                    'total_cost': market_summary.total_cost,
                    'total_return_pct': market_summary.total_return_pct,
                    'weight_in_portfolio': (market_summary.total_value / portfolio_summary.total_portfolio_value) * 100
                }
            }
            
            for holding in market_summary.holdings:
                holding_data = {
                    'symbol': holding.security.symbol,
                    'name': holding.security.name,
                    'price': holding.current_price,
                    'quantity': holding.quantity,
                    'value': holding.current_value_gbp,
                    'capital_gains_pct': holding.capital_gains_pct,
                    'dividend_yield_pct': holding.dividend_yield_pct,
                    'currency_effect_pct': holding.currency_effect_pct,
                    'total_return_pct': holding.total_return_pct
                }
                market_data['holdings'].append(holding_data)
            
            report['markets'][market_name] = market_data
        
        return report
    
    def generate_csv_portfolio_report(
        self, 
        portfolio_summary: PortfolioSummary, 
        output_path: str
    ) -> None:
        """Generate CSV portfolio report."""
        with open(output_path, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                'Market', 'Symbol', 'Name', 'Price', 'Quantity', 'Value (GBP)',
                'Capital Gains %', 'Dividends %', 'Currency %', 'Return %'
            ])
            
            # Write holdings by market
            for market_name, market_summary in portfolio_summary.market_summaries.items():
                for holding in market_summary.holdings:
                    writer.writerow([
                        market_name,
                        holding.security.symbol,
                        holding.security.name,
                        f"{holding.current_price:.2f}",
                        f"{holding.quantity:.0f}",
                        f"{holding.current_value_gbp:.2f}",
                        f"{holding.capital_gains_pct:.2f}%",
                        f"{holding.dividend_yield_pct:.2f}%",
                        f"{holding.currency_effect_pct:.2f}%",
                        f"{holding.total_return_pct:.2f}%"
                    ])
                
                # Write market total
                writer.writerow([
                    f"Total ({market_name})",
                    "", "", "", "",
                    f"{market_summary.total_value:.2f}",
                    f"{market_summary.total_return_pct:.2f}%",
                    "", "", ""
                ])
                writer.writerow([])  # Blank line
            
            # Write grand total
            writer.writerow([
                "Grand Total",
                "", "", "", "",
                f"{portfolio_summary.total_portfolio_value:.2f}",
                f"{portfolio_summary.total_return_pct:.2f}%",
                "", "", ""
            ])
```

**Implementation Details:**
- Generate market-grouped portfolio reports
- Support multiple output formats (JSON, CSV, HTML)
- Include all performance metrics
- Match the desired output format from the image
- Support customizable report templates

**Test Requirements:**
- Unit tests for report generation
- Output format validation tests
- Data accuracy verification
- Integration tests with portfolio calculator

---

### Task 6.2: Enhanced Web Interface Templates
**File:** `web_app/templates/portfolio_view.html`

**Description:**
Create new web templates to display the portfolio view matching the desired output format.

**New Template:**
```html
{% extends "base.html" %}

{% block title %}Portfolio Holdings{% endblock %}

{% block content %}
<div class="card">
    <div class="card-header bg-primary text-white">
        <h2>Your investments grouped by market</h2>
        <h5>As of: {{ portfolio.as_of_date.strftime('%d %B %Y') }}</h5>
    </div>
    <div class="card-body">
        {% for market_name, market_data in portfolio.markets.items() %}
        <div class="market-section mb-4">
            <h4 class="market-header">{{ market_name }}</h4>
            
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Security</th>
                            <th>Price</th>
                            <th>QTY</th>
                            <th>Value</th>
                            <th>Capital Gains</th>
                            <th>Dividends</th>
                            <th>Currency</th>
                            <th>Return</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for holding in market_data.holdings %}
                        <tr>
                            <td>
                                <strong>{{ holding.symbol }}</strong><br>
                                <small class="text-muted">{{ holding.name }}</small>
                            </td>
                            <td>{{ "%.2f"|format(holding.price) }}</td>
                            <td>{{ "%.0f"|format(holding.quantity) }}</td>
                            <td>£{{ "%.2f"|format(holding.value) }}</td>
                            <td class="{% if holding.capital_gains_pct < 0 %}text-danger{% else %}text-success{% endif %}">
                                {{ "%.2f"|format(holding.capital_gains_pct) }}%
                            </td>
                            <td>{{ "%.2f"|format(holding.dividend_yield_pct) }}%</td>
                            <td class="{% if holding.currency_effect_pct < 0 %}text-danger{% else %}text-success{% endif %}">
                                {{ "%.2f"|format(holding.currency_effect_pct) }}%
                            </td>
                            <td class="{% if holding.total_return_pct < 0 %}text-danger{% else %}text-success{% endif %}">
                                <strong>{{ "%.2f"|format(holding.total_return_pct) }}%</strong>
                            </td>
                        </tr>
                        {% endfor %}
                        
                        <!-- Market Total Row -->
                        <tr class="table-secondary">
                            <td><strong>Total ({{ market_name }})</strong></td>
                            <td></td>
                            <td></td>
                            <td><strong>£{{ "%.2f"|format(market_data.totals.total_value) }}</strong></td>
                            <td><strong>{{ "%.2f"|format(market_data.totals.total_return_pct) }}%</strong></td>
                            <td></td>
                            <td></td>
                            <td><strong>{{ "%.2f"|format(market_data.totals.total_return_pct) }}%</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        {% endfor %}
        
        <!-- Grand Total Section -->
        <div class="grand-total-section mt-4">
            <div class="table-responsive">
                <table class="table table-dark">
                    <tbody>
                        <tr>
                            <td><strong>Grand Total since [Date]</strong></td>
                            <td></td>
                            <td></td>
                            <td><strong>£{{ "%.2f"|format(portfolio.grand_total.total_value) }}</strong></td>
                            <td><strong>{{ "%.2f"|format(portfolio.grand_total.total_return_pct) }}%</strong></td>
                            <td></td>
                            <td></td>
                            <td><strong>{{ "%.2f"|format(portfolio.grand_total.total_return_pct) }}%</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="row mt-4">
            <div class="col-md-6">
                <a href="{{ url_for('portfolio.download_csv') }}" class="btn btn-primary">
                    <i class="bi bi-download"></i> Download Portfolio CSV
                </a>
                <a href="{{ url_for('main.index') }}" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-repeat"></i> Upload New Data
                </a>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block extra_css %}
<style>
.market-header {
    background-color: #f8f9fa;
    padding: 10px;
    border-left: 4px solid #007bff;
    margin-bottom: 15px;
}

.market-section {
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
}

.grand-total-section {
    border-top: 2px solid #007bff;
    padding-top: 15px;
}
</style>
{% endblock %}
```

**Implementation Details:**
- Create portfolio view template matching the desired format
- Include market grouping with collapsible sections
- Display all performance metrics with proper formatting
- Add responsive design for mobile devices
- Include download and navigation options

**Test Requirements:**
- Template rendering tests
- Responsive design verification
- Data display accuracy tests
- Cross-browser compatibility tests

---

### Task 6.3: Enhanced Web Routes for Portfolio View
**File:** `web_app/routes/portfolio.py`

**Description:**
Create new web routes to handle portfolio view requests.

**New Routes File:**
```python
from flask import Blueprint, render_template, request, jsonify, send_file
from ..services.portfolio_calculator import PortfolioCalculator
from ..services.performance_calculator import PerformanceCalculator
from ..services.portfolio_report_generator import PortfolioReportGenerator

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/portfolio')

@portfolio_bp.route('/view')
def view_portfolio():
    """Display portfolio holdings view."""
    try:
        # Get session data (transactions, etc.)
        session_data = get_session_data()
        
        if not session_data or 'transactions' not in session_data:
            return redirect(url_for('main.index'))
        
        # Calculate portfolio holdings
        portfolio_calc = PortfolioCalculator()
        performance_calc = PerformanceCalculator()
        
        holdings = portfolio_calc.calculate_current_holdings(
            session_data['transactions']
        )
        
        # Calculate performance metrics
        for holding in holdings:
            performance_calc.calculate_holding_performance(
                holding, 
                session_data['transactions'],
                session_data.get('dividends', [])
            )
        
        # Group by market
        market_holdings = portfolio_calc.group_holdings_by_market(holdings)
        market_summaries = portfolio_calc.calculate_market_totals(market_holdings)
        
        # Create portfolio summary
        portfolio_summary = PortfolioSummary(
            market_summaries=market_summaries,
            total_portfolio_value=sum(s.total_value for s in market_summaries.values()),
            total_portfolio_cost=sum(s.total_cost for s in market_summaries.values()),
            total_unrealized_gain_loss=sum(s.total_unrealized_gain_loss for s in market_summaries.values())
        )
        
        # Generate report data
        report_gen = PortfolioReportGenerator()
        portfolio_report = report_gen.generate_market_grouped_report(portfolio_summary)
        
        return render_template('portfolio_view.html', portfolio=portfolio_report)
        
    except Exception as e:
        logger.error(f"Error generating portfolio view: {e}")
        return render_template('500.html'), 500

@portfolio_bp.route('/download/csv')
def download_csv():
    """Download portfolio as CSV file."""
    try:
        # Similar logic to view_portfolio but generate CSV
        # ... portfolio calculation logic ...
        
        report_gen = PortfolioReportGenerator()
        csv_path = f"/tmp/portfolio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        report_gen.generate_csv_portfolio_report(portfolio_summary, csv_path)
        
        return send_file(
            csv_path,
            as_attachment=True,
            download_name=f"portfolio_{datetime.now().strftime('%Y%m%d')}.csv",
            mimetype='text/csv'
        )
        
    except Exception as e:
        logger.error(f"Error generating portfolio CSV: {e}")
        return jsonify({'error': 'Failed to generate CSV'}), 500

@portfolio_bp.route('/api/holdings')
def api_holdings():
    """API endpoint for portfolio holdings data."""
    try:
        # Return JSON data for AJAX requests
        # ... portfolio calculation logic ...
        
        return jsonify(portfolio_report)
        
    except Exception as e:
        logger.error(f"Error in portfolio API: {e}")
        return jsonify({'error': 'Failed to load portfolio data'}), 500
```

**Implementation Details:**
- Create portfolio-specific routes
- Integrate with portfolio calculator services
- Handle CSV download functionality
- Provide API endpoints for AJAX requests
- Include proper error handling and logging

**Test Requirements:**
- Route functionality tests
- CSV download tests
- API endpoint tests
- Error handling verification
- Integration tests with portfolio services

---

## PHASE 7: Integration and Testing

### Task 7.1: Update Main Calculator Integration
**File:** `src/main/python/capital_gains_calculator.py`

**Description:**
Update the main calculator to integrate all new services and provide comprehensive tax and portfolio analysis.

**Enhanced Main Calculator:**
```python
class EnhancedCapitalGainsCalculator:
    """Enhanced calculator with comprehensive tax and portfolio analysis."""
    
    def __init__(
        self,
        parser: FileParserInterface,
        disposal_calculator: DisposalCalculator,
        dividend_processor: DividendProcessor,
        currency_processor: CurrencyExchangeProcessor,
        portfolio_calculator: PortfolioCalculator,
        performance_calculator: PerformanceCalculator
    ):
        self.parser = parser
        self.disposal_calculator = disposal_calculator
        self.dividend_processor = dividend_processor
        self.currency_processor = currency_processor
        self.portfolio_calculator = portfolio_calculator
        self.performance_calculator = performance_calculator
        self.logger = logging.getLogger(__name__)
    
    def calculate_comprehensive_analysis(
        self, 
        file_path: str, 
        tax_year: str,
        analysis_type: str = "both"  # "tax", "portfolio", "both"
    ) -> Dict[str, Any]:
        """Perform comprehensive tax and portfolio analysis."""
        
        # Parse transactions
        transactions = self.parser.parse(file_path)
        
        results = {}
        
        if analysis_type in ["tax", "both"]:
            # Calculate comprehensive tax summary
            tax_calculator = EnhancedTaxYearCalculator(
                self.disposal_calculator,
                self.dividend_processor,
                self.currency_processor
            )
            
            tax_summary = tax_calculator.calculate_comprehensive_tax_summary(
                transactions, tax_year
            )
            results['tax_analysis'] = tax_summary
        
        if analysis_type in ["portfolio", "both"]:
            # Calculate portfolio holdings and performance
            holdings = self.portfolio_calculator.calculate_current_holdings(transactions)
            
            # Process dividends for performance calculation
            dividends = self.dividend_processor.process_dividend_transactions(transactions)
            
            # Calculate performance metrics
            for holding in holdings:
                self.performance_calculator.calculate_holding_performance(
                    holding, transactions, dividends
                )
            
            # Group by market and calculate summaries
            market_holdings = self.portfolio_calculator.group_holdings_by_market(holdings)
            market_summaries = self.portfolio_calculator.calculate_market_totals(market_holdings)
            
            portfolio_summary = PortfolioSummary(
                market_summaries=market_summaries,
                total_portfolio_value=sum(s.total_value for s in market_summaries.values()),
                total_portfolio_cost=sum(s.total_cost for s in market_summaries.values()),
                total_unrealized_gain_loss=sum(s.total_unrealized_gain_loss for s in market_summaries.values())
            )
            
            results['portfolio_analysis'] = portfolio_summary
        
        return results
```

**Implementation Details:**
- Integrate all new services into main calculator
- Support both tax and portfolio analysis modes
- Provide unified interface for comprehensive analysis
- Maintain backward compatibility with existing functionality

**Test Requirements:**
- Integration tests with all services
- Comprehensive analysis accuracy tests
- Performance tests with large datasets
- Backward compatibility verification

---

### Task 7.2: Comprehensive Test Suite
**File:** `tests/integration/test_comprehensive_analysis.py`

**Description:**
Create comprehensive integration tests using real Sharesight data.

**Test Implementation:**
```python
class TestComprehensiveAnalysis:
    """Integration tests for comprehensive tax and portfolio analysis."""
    
    def test_full_sharesight_analysis(self):
        """Test complete analysis with real Sharesight CSV data."""
        # Load real Sharesight CSV
        csv_path = "data/Sharesight.csv"
        
        # Initialize enhanced calculator
        calculator = self._create_enhanced_calculator()
        
        # Perform comprehensive analysis
        results = calculator.calculate_comprehensive_analysis(
            csv_path, "2024-2025", "both"
        )
        
        # Verify tax analysis
        assert 'tax_analysis' in results
        tax_summary = results['tax_analysis']
        assert tax_summary.capital_gains is not None
        assert tax_summary.dividend_income is not None
        assert tax_summary.currency_gains is not None
        
        # Verify portfolio analysis
        assert 'portfolio_analysis' in results
        portfolio_summary = results['portfolio_analysis']
        assert len(portfolio_summary.market_summaries) > 0
        assert portfolio_summary.total_portfolio_value > 0
    
    def test_dividend_processing_accuracy(self):
        """Test dividend processing with known data."""
        # Test with specific dividend transactions
        pass
    
    def test_currency_exchange_calculations(self):
        """Test currency exchange gain/loss calculations."""
        # Test with specific FX transactions
        pass
    
    def test_portfolio_performance_metrics(self):
        """Test portfolio performance calculations."""
        # Test with known holdings and performance data
        pass
    
    def test_market_grouping_accuracy(self):
        """Test market grouping functionality."""
        # Verify holdings are grouped correctly by exchange
        pass
```

**Implementation Details:**
- Create comprehensive integration tests
- Use real Sharesight data for testing
- Verify accuracy of all calculations
- Test edge cases and error conditions
- Include performance benchmarks

**Test Requirements:**
- All integration tests must pass
- Code coverage > 90%
- Performance benchmarks met
- No regression in existing functionality

---

## Implementation Timeline and Dependencies

### Phase 1 (Foundation): 2-3 weeks
- Tasks 1.1, 1.2, 1.3 (Transaction types, asset classes, enhanced CSV parser)
- **Dependencies:** None
- **Deliverables:** Enhanced transaction processing foundation

### Phase 2 (Dividend Processing): 1-2 weeks  
- Tasks 2.1, 2.2 (Dividend models and processing)
- **Dependencies:** Phase 1 complete
- **Deliverables:** Dividend income calculation

### Phase 3 (Currency Processing): 1-2 weeks
- Tasks 3.1, 3.2 (Currency exchange models and processing)
- **Dependencies:** Phase 1 complete
- **Deliverables:** Currency gain/loss calculation

### Phase 4 (Enhanced Tax Calculation): 1 week
- Tasks 4.1, 4.2 (Enhanced tax calculator and comprehensive summary)
- **Dependencies:** Phases 2 and 3 complete
- **Deliverables:** Comprehensive tax calculation

### Phase 5 (Portfolio Analytics): 2-3 weeks
- Tasks 5.1, 5.2, 5.3 (Portfolio calculator, models, performance metrics)
- **Dependencies:** Phase 1 complete
- **Deliverables:** Portfolio holdings and performance analysis

### Phase 6 (Enhanced Reporting): 1-2 weeks
- Tasks 6.1, 6.2, 6.3 (Report generation, web templates, routes)
- **Dependencies:** Phases 4 and 5 complete
- **Deliverables:** Enhanced web interface with portfolio view

### Phase 7 (Integration & Testing): 1 week
- Tasks 7.1, 7.2 (Integration and comprehensive testing)
- **Dependencies:** All previous phases complete
- **Deliverables:** Fully integrated and tested system

**Total Estimated Timeline: 8-12 weeks**

---

## Success Criteria

1. **Comprehensive Tax Calculation:**
   - All transaction types processed correctly
   - Dividend income calculated and reported
   - Currency exchange gains/losses included
   - All allowable costs properly included

2. **Portfolio View:**
   - Current holdings calculated accurately
   - Holdings grouped by market/exchange
   - Performance metrics displayed (capital gains %, dividends %, currency %, total return %)
   - Matches the desired output format from the provided image

3. **Data Accuracy:**
   - All calculations verified against manual calculations
   - Integration tests pass with real Sharesight data
   - No regression in existing functionality

4. **User Experience:**
   - Intuitive web interface
   - Fast performance with large datasets
   - Clear error messages and validation
   - Export functionality for reports

5. **Code Quality:**
   - Comprehensive test coverage (>90%)
   - Clean, maintainable code following SOLID principles
   - Proper error handling and logging
   - Documentation for all new components
