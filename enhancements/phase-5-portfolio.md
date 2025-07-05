# Phase 5: Portfolio Holdings and Performance Analytics

## Overview

This phase implements the core functionality to calculate current portfolio holdings and performance metrics, enabling the portfolio view that matches your desired output format. This includes calculating current positions, grouping by market/exchange, and computing performance metrics like capital gains %, dividends %, currency effects, and total returns.

## Goals

1. **Calculate current portfolio holdings** - Determine current positions from transaction history
2. **Implement market grouping** - Group holdings by exchange (LSE, NASDAQ, NYSE, etc.)
3. **Calculate performance metrics** - Capital gains %, dividend yield %, currency effects, total returns
4. **Support portfolio analytics** - Market summaries, totals, and portfolio-level metrics

---

## Task Tracking

| Task | Description | Estimated Time | Status | Dependencies |
|------|-------------|----------------|--------|--------------|
| 5.1 | Portfolio Holdings Calculator | 4 days | 🔲 Todo | Phase 1 complete |
| 5.2 | Portfolio Holdings Domain Models | 2 days | 🔲 Todo | Task 5.1 |
| 5.3 | Performance Metrics Calculator | 3 days | 🔲 Todo | Tasks 5.1, 5.2, Phase 2 |

**Total Phase Duration: 2-3 weeks**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Task 5.1: Portfolio Holdings Calculator

**File:** `src/main/python/services/portfolio_calculator.py`

**Estimated Time:** 4 days

### Description
Create a service to calculate current portfolio holdings from transaction history using proper position tracking.

### New Service Class

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
        self.logger.info(f"Calculating current holdings from {len(transactions)} transactions")
        
        holdings_map = {}
        
        # Group transactions by security
        security_transactions = self._group_by_security(transactions)
        
        for security_id, security_txns in security_transactions.items():
            holding = self._calculate_security_holding(security_txns)
            if holding and holding.quantity > 0:
                holdings_map[security_id] = holding
        
        holdings = list(holdings_map.values())
        self.logger.info(f"Calculated {len(holdings)} current holdings")
        
        return holdings
    
    def _group_by_security(
        self, 
        transactions: List[Transaction]
    ) -> Dict[str, List[Transaction]]:
        """Group transactions by security ISIN."""
        grouped = {}
        
        for transaction in transactions:
            # Only process stock transactions for holdings
            if transaction.transaction_type in [TransactionType.BUY, TransactionType.SELL]:
                isin = transaction.security.isin
                if isin not in grouped:
                    grouped[isin] = []
                grouped[isin].append(transaction)
        
        return grouped
    
    def _calculate_security_holding(
        self, 
        transactions: List[Transaction]
    ) -> Optional[Holding]:
        """Calculate holding for a specific security using Section 104 pool rules."""
        if not transactions:
            return None
        
        security = transactions[0].security
        
        # Sort transactions by date
        sorted_transactions = sorted(transactions, key=lambda t: t.date)
        
        # Track position using Section 104 pool
        pool_quantity = 0.0
        pool_cost_gbp = 0.0
        
        for transaction in sorted_transactions:
            if transaction.transaction_type == TransactionType.BUY:
                # Add to pool
                pool_quantity += transaction.quantity
                pool_cost_gbp += transaction.total_cost_in_base_currency
                
            elif transaction.transaction_type == TransactionType.SELL:
                # Remove from pool (proportionally)
                sell_quantity = abs(transaction.quantity)
                
                if pool_quantity > 0:
                    # Calculate proportion being sold
                    proportion = min(sell_quantity / pool_quantity, 1.0)
                    
                    # Remove proportional cost
                    cost_removed = pool_cost_gbp * proportion
                    pool_cost_gbp -= cost_removed
                    pool_quantity -= sell_quantity
                    
                    # Ensure we don't go negative
                    pool_quantity = max(0, pool_quantity)
                    pool_cost_gbp = max(0, pool_cost_gbp)
        
        if pool_quantity <= 0:
            return None
        
        # Get current price (use latest transaction price as proxy)
        current_price = self._get_current_price(security, sorted_transactions)
        
        # Calculate current value in GBP
        current_value_gbp = pool_quantity * current_price
        if security.currency and security.currency.rate_to_base != 1.0:
            current_value_gbp *= security.currency.rate_to_base
        
        # Calculate average cost per share
        average_cost_gbp = pool_cost_gbp / pool_quantity if pool_quantity > 0 else 0
        
        return Holding(
            security=security,
            quantity=pool_quantity,
            average_cost_gbp=average_cost_gbp,
            current_price=current_price,
            current_value_gbp=current_value_gbp,
            market=security.listing_exchange or "UNKNOWN",
            unrealized_gain_loss=current_value_gbp - pool_cost_gbp
        )
    
    def _get_current_price(
        self, 
        security: Security, 
        transactions: List[Transaction]
    ) -> float:
        """Get current price for a security."""
        # For now, use the most recent transaction price
        # In a real system, this would fetch current market prices
        
        # Find most recent transaction
        recent_transaction = max(transactions, key=lambda t: t.date)
        
        # Use close price if available, otherwise trade price
        if hasattr(recent_transaction, 'close_price') and recent_transaction.close_price > 0:
            return recent_transaction.close_price
        else:
            return recent_transaction.price_per_unit
    
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
        
        # Sort holdings within each market by value (descending)
        for market in market_groups:
            market_groups[market].sort(
                key=lambda h: h.current_value_gbp, 
                reverse=True
            )
        
        return market_groups
    
    def calculate_market_totals(
        self, 
        market_holdings: Dict[str, List[Holding]]
    ) -> Dict[str, MarketSummary]:
        """Calculate totals for each market."""
        market_summaries = {}
        
        for market, holdings in market_holdings.items():
            total_value = sum(h.current_value_gbp for h in holdings)
            total_cost = sum(h.average_cost_gbp * h.quantity for h in holdings)
            total_unrealized_gain_loss = sum(h.unrealized_gain_loss for h in holdings)
            
            summary = MarketSummary(
                market_name=market,
                holdings=holdings,
                total_value=total_value,
                total_cost=total_cost,
                total_unrealized_gain_loss=total_unrealized_gain_loss
            )
            
            market_summaries[market] = summary
        
        return market_summaries
    
    def calculate_portfolio_totals(
        self, 
        market_summaries: Dict[str, MarketSummary]
    ) -> PortfolioSummary:
        """Calculate portfolio-level totals."""
        total_value = sum(s.total_value for s in market_summaries.values())
        total_cost = sum(s.total_cost for s in market_summaries.values())
        total_unrealized_gain_loss = sum(s.total_unrealized_gain_loss for s in market_summaries.values())
        
        # Calculate market weights
        for summary in market_summaries.values():
            if total_value > 0:
                summary.weight_in_portfolio = (summary.total_value / total_value) * 100
        
        return PortfolioSummary(
            market_summaries=market_summaries,
            total_portfolio_value=total_value,
            total_portfolio_cost=total_cost,
            total_unrealized_gain_loss=total_unrealized_gain_loss
        )
```

### Implementation Details

1. **Calculate current holdings from transaction history**
   - Use Section 104 pool rules for UK tax compliance
   - Handle buy/sell transactions properly
   - Track average cost basis accurately

2. **Handle buy/sell position tracking**
   - Implement proper FIFO/Section 104 matching
   - Calculate proportional cost basis for sales
   - Maintain accurate position quantities

3. **Group holdings by market/exchange**
   - Use ListingExchange field from enhanced Security model
   - Sort holdings by value within each market
   - Handle unknown/missing exchange data

4. **Calculate market-level summaries**
   - Aggregate values, costs, and gains by market
   - Calculate market weights in portfolio
   - Provide comprehensive market statistics

### Files to Create
- `src/main/python/services/portfolio_calculator.py` - Main service class

### Test Requirements
- Unit tests for position calculations
- Buy/sell matching accuracy tests
- Market grouping verification
- Integration tests with real transaction data
- Edge case testing (zero positions, negative values)

### Acceptance Criteria
- [ ] Current holdings calculated accurately using Section 104 rules
- [ ] Buy/sell transactions processed correctly
- [ ] Market grouping works with real exchange data
- [ ] Market summaries calculated properly
- [ ] Portfolio totals are accurate
- [ ] Performance is acceptable with large datasets
- [ ] All tests pass

---

## Task 5.2: Portfolio Holdings Domain Models

**File:** `src/main/python/models/domain_models.py`

**Estimated Time:** 2 days

### Description
Create domain models for portfolio holdings and performance metrics.

### New Domain Models

#### Holding Model
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
    
    # Performance metrics (calculated by PerformanceCalculator)
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
    
    @property
    def current_price_gbp(self) -> float:
        """Current price converted to GBP."""
        if self.security and self.security.currency:
            return self.current_price * self.security.currency.rate_to_base
        return self.current_price
    
    def __post_init__(self):
        """Validate holding data after initialization."""
        self._validate_holding()
    
    def _validate_holding(self) -> None:
        """Validate holding data."""
        if self.quantity < 0:
            raise ValueError("Holding quantity cannot be negative")
        
        if self.current_price < 0:
            raise ValueError("Current price cannot be negative")
        
        if self.average_cost_gbp < 0:
            raise ValueError("Average cost cannot be negative")
```

#### MarketSummary Model
```python
@dataclass
class MarketSummary:
    """Summary of holdings for a specific market."""
    market_name: str
    holdings: List[Holding] = field(default_factory=list)
    total_value: float = 0.0
    total_cost: float = 0.0
    total_unrealized_gain_loss: float = 0.0
    weight_in_portfolio: float = 0.0  # Percentage weight
    
    @property
    def total_return_pct(self) -> float:
        """Total return percentage for the market."""
        if self.total_cost > 0:
            return (self.total_unrealized_gain_loss / self.total_cost) * 100
        return 0.0
    
    @property
    def number_of_holdings(self) -> int:
        """Number of holdings in this market."""
        return len(self.holdings)
    
    @property
    def average_return_pct(self) -> float:
        """Average return percentage across holdings."""
        if not self.holdings:
            return 0.0
        
        total_return = sum(h.total_return_pct for h in self.holdings)
        return total_return / len(self.holdings)
    
    def get_top_holdings(self, count: int = 5) -> List[Holding]:
        """Get top holdings by value."""
        return sorted(
            self.holdings, 
            key=lambda h: h.current_value_gbp, 
            reverse=True
        )[:count]
```

#### PortfolioSummary Model
```python
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
    
    @property
    def number_of_markets(self) -> int:
        """Number of markets in the portfolio."""
        return len(self.market_summaries)
    
    def get_all_holdings(self) -> List[Holding]:
        """Get all holdings across all markets."""
        all_holdings = []
        for summary in self.market_summaries.values():
            all_holdings.extend(summary.holdings)
        return all_holdings
    
    def get_top_holdings(self, count: int = 10) -> List[Holding]:
        """Get top holdings by value across entire portfolio."""
        all_holdings = self.get_all_holdings()
        return sorted(
            all_holdings, 
            key=lambda h: h.current_value_gbp, 
            reverse=True
        )[:count]
    
    def get_market_allocation(self) -> Dict[str, float]:
        """Get portfolio allocation by market."""
        allocation = {}
        for market_name, summary in self.market_summaries.items():
            allocation[market_name] = summary.weight_in_portfolio
        return allocation
```

### Implementation Details

1. **Create comprehensive holding model**
   - Include all required fields for portfolio view
   - Add calculated properties for convenience
   - Include validation logic

2. **Create market summary model**
   - Aggregate holdings by market
   - Calculate market-level statistics
   - Provide top holdings functionality

3. **Create portfolio summary model**
   - Portfolio-level aggregations
   - Market allocation calculations
   - Top holdings across entire portfolio

### Files to Update
- `src/main/python/models/domain_models.py` - Add new models

### Test Requirements
- Unit tests for all model calculations
- Property calculation verification
- Validation logic testing
- Edge case handling

### Acceptance Criteria
- [ ] Holding model created with all required fields
- [ ] MarketSummary model aggregates correctly
- [ ] PortfolioSummary model provides portfolio-level view
- [ ] All calculated properties work correctly
- [ ] Validation prevents invalid data
- [ ] All unit tests pass

---

## Task 5.3: Performance Metrics Calculator

**File:** `src/main/python/services/performance_calculator.py`

**Estimated Time:** 3 days

### Description
Create a service to calculate performance metrics for portfolio holdings, including capital gains %, dividend yield %, currency effects, and total returns.

### New Service Class

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
        """Calculate dividend yield percentage based on current value."""
        # Filter dividends for this security
        security_dividends = [
            d for d in dividends 
            if d.security.isin == holding.security.isin
        ]
        
        if not security_dividends or holding.current_value_gbp == 0:
            return 0.0
        
        # Calculate annual dividend yield based on last 12 months
        one_year_ago = datetime.now() - timedelta(days=365)
        recent_dividends = [
            d for d in security_dividends 
            if d.payment_date >= one_year_ago
        ]
        
        total_dividends = sum(d.net_dividend_gbp for d in recent_dividends)
        return (total_dividends / holding.current_value_gbp) * 100
    
    def _calculate_currency_effect(
        self, 
        holding: Holding, 
        transactions: List[Transaction]
    ) -> float:
        """Calculate currency effect on returns."""
        # This calculates the impact of currency movements on returns
        # by comparing returns in original currency vs GBP
        
        if not holding.security.currency or holding.security.currency.code == "GBP":
            return 0.0
        
        # Get transactions for this security
        security_transactions = [
            t for t in transactions 
            if t.security.isin == holding.security.isin
        ]
        
        if not security_transactions:
            return 0.0
        
        # Calculate weighted average purchase exchange rate
        total_cost_foreign = 0.0
        total_cost_gbp = 0.0
        
        for transaction in security_transactions:
            if transaction.transaction_type == TransactionType.BUY:
                cost_foreign = transaction.quantity * transaction.price_per_unit
                cost_gbp = transaction.total_cost_in_base_currency
                
                total_cost_foreign += cost_foreign
                total_cost_gbp += cost_gbp
        
        if total_cost_foreign == 0:
            return 0.0
        
        # Average purchase rate
        avg_purchase_rate = total_cost_gbp / total_cost_foreign
        
        # Current rate
        current_rate = holding.security.currency.rate_to_base
        
        # Currency effect = (current_rate - avg_purchase_rate) / avg_purchase_rate * 100
        if avg_purchase_rate > 0:
            currency_effect = ((current_rate - avg_purchase_rate) / avg_purchase_rate) * 100
            return currency_effect
        
        return 0.0
    
    def _calculate_total_return(self, holding: Holding) -> float:
        """Calculate total return including capital gains and dividends."""
        return holding.capital_gains_pct + holding.dividend_yield_pct
    
    def calculate_portfolio_performance(
        self, 
        portfolio_summary: PortfolioSummary
    ) -> Dict[str, float]:
        """Calculate portfolio-level performance metrics."""
        all_holdings = portfolio_summary.get_all_holdings()
        
        if not all_holdings:
            return {
                'total_return_pct': 0.0,
                'capital_gains_pct': 0.0,
                'dividend_yield_pct': 0.0,
                'currency_effect_pct': 0.0
            }
        
        # Calculate value-weighted averages
        total_value = portfolio_summary.total_portfolio_value
        
        weighted_capital_gains = sum(
            (h.current_value_gbp / total_value) * h.capital_gains_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        weighted_dividend_yield = sum(
            (h.current_value_gbp / total_value) * h.dividend_yield_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        weighted_currency_effect = sum(
            (h.current_value_gbp / total_value) * h.currency_effect_pct 
            for h in all_holdings
        ) if total_value > 0 else 0.0
        
        return {
            'total_return_pct': portfolio_summary.total_return_pct,
            'capital_gains_pct': weighted_capital_gains,
            'dividend_yield_pct': weighted_dividend_yield,
            'currency_effect_pct': weighted_currency_effect
        }
    
    def calculate_market_performance(
        self, 
        market_summary: MarketSummary
    ) -> Dict[str, float]:
        """Calculate market-level performance metrics."""
        if not market_summary.holdings:
            return {
                'total_return_pct': 0.0,
                'capital_gains_pct': 0.0,
                'dividend_yield_pct': 0.0,
                'currency_effect_pct': 0.0
            }
        
        # Calculate value-weighted averages for the market
        total_value = market_summary.total_value
        
        weighted_capital_gains = sum(
            (h.current_value_gbp / total_value) * h.capital_gains_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        weighted_dividend_yield = sum(
            (h.current_value_gbp / total_value) * h.dividend_yield_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        weighted_currency_effect = sum(
            (h.current_value_gbp / total_value) * h.currency_effect_pct 
            for h in market_summary.holdings
        ) if total_value > 0 else 0.0
        
        return {
            'total_return_pct': market_summary.total_return_pct,
            'capital_gains_pct': weighted_capital_gains,
            'dividend_yield_pct': weighted_dividend_yield,
            'currency_effect_pct': weighted_currency_effect
        }
```

### Implementation Details

1. **Calculate capital gains percentages**
   - Use unrealized gain/loss vs cost basis
   - Handle zero cost basis edge cases

2. **Calculate dividend yields based on current value**
   - Use last 12 months of dividend data
   - Calculate yield as percentage of current value
   - Handle securities with no dividends

3. **Calculate currency effects on returns**
   - Compare purchase exchange rates vs current rates
   - Calculate impact of currency movements
   - Handle GBP securities (no currency effect)

4. **Calculate total returns combining all factors**
   - Sum capital gains and dividend yield
   - Provide portfolio and market-level aggregations
   - Use value-weighted averages for aggregations

### Files to Create
- `src/main/python/services/performance_calculator.py` - Main service class

### Test Requirements
- Unit tests for each performance metric
- Accuracy tests with known data
- Edge case handling (zero values, negative returns)
- Integration tests with real portfolio data
- Currency effect calculation verification

### Acceptance Criteria
- [ ] Capital gains percentages calculated correctly
- [ ] Dividend yields calculated based on current values
- [ ] Currency effects calculated accurately
- [ ] Total returns combine all factors properly
- [ ] Portfolio-level aggregations use value weighting
- [ ] Market-level aggregations work correctly
- [ ] Edge cases handled gracefully
- [ ] All tests pass

---

## Dependencies and Prerequisites

### External Dependencies
- No new external dependencies required
- Uses existing Python standard library and project dependencies

### Internal Dependencies
- **Phase 1 complete** - Enhanced transaction types, asset classes, CSV parser
- **Phase 2 complete** - Dividend processing (for dividend yield calculations)
- Existing domain models (`Transaction`, `Security`, `Currency`)
- Existing test infrastructure

### Data Requirements
- Transaction history for position calculations
- Current price data (from latest transactions or external sources)
- Dividend data for yield calculations
- Exchange/market data from enhanced Security model

---

## Testing Strategy

### Unit Tests
- Test position calculation logic
- Test performance metric calculations
- Test market grouping functionality
- Test portfolio aggregations
- Test edge cases and error conditions

### Integration Tests
- Test with real Sharesight transaction data
- Test end-to-end portfolio calculation
- Test with multiple markets and currencies
- Performance testing with large portfolios

### Test Data Management
- Create comprehensive portfolio test scenarios
- Include multiple markets and asset classes
- Test with various performance scenarios (gains, losses, dividends)

---

## Success Criteria

### Functional Requirements
- [ ] Current holdings calculated accurately from transaction history
- [ ] Holdings grouped correctly by market/exchange
- [ ] Performance metrics calculated properly (capital gains %, dividends %, currency %, total return %)
- [ ] Portfolio and market-level aggregations work correctly
- [ ] Matches the desired output format from the provided image

### Non-Functional Requirements
- [ ] Performance is acceptable for typical portfolio sizes
- [ ] Memory usage is reasonable for large portfolios
- [ ] Error handling is comprehensive and informative
- [ ] Code coverage > 90% for new code

### Quality Requirements
- [ ] Code follows existing project patterns
- [ ] Comprehensive documentation
- [ ] All tests pass
- [ ] Integration with existing components

---

## Integration Points

### With Phase 1
- Uses enhanced Security model with listing_exchange field
- Relies on improved transaction processing
- Uses asset class information for categorization

### With Phase 2
- Uses dividend data for yield calculations
- Integrates dividend income into performance metrics

### With Phase 6
- Provides data for portfolio view templates
- Enables market-grouped reporting
- Supports the desired output format

---

## Next Steps

After completing Phase 5, the system will have comprehensive portfolio analytics capabilities. This enables:

1. **Phase 6: Enhanced Reporting** - Use portfolio data for the desired output format
2. **Integration with tax calculation** - Combine portfolio view with tax analysis
3. **Performance tracking** - Historical performance analysis capabilities

The portfolio calculator and performance metrics are essential for creating the market-grouped portfolio view shown in your desired output image.

---

*Last Updated: 2025-06-24*
