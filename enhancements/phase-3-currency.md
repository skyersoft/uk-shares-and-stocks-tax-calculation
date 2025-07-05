# Phase 3: Currency Exchange Gain/Loss Processing

## Overview

This phase implements currency exchange transaction processing for tax purposes. The Sharesight CSV contains currency exchange transactions (e.g., EUR.GBP, GBP.USD) that create taxable gains and losses under UK tax rules. This phase will implement FIFO matching for currency disposals and calculate taxable gains/losses on currency exchanges.

## Goals

1. **Create currency exchange domain models** - Track currency transactions and gains/losses
2. **Build currency processing service** - Process FX transactions and calculate tax implications
3. **Implement FIFO matching** - Proper matching for currency disposals
4. **Generate currency summaries** - Tax year summaries for currency gains/losses

---

## Task Tracking

| Task | Description | Estimated Time | Status | Dependencies |
|------|-------------|----------------|--------|--------------|
| 3.1 | Currency Exchange Domain Models | 2 days | 🔲 Todo | Phase 1 complete |
| 3.2 | Currency Exchange Processing Service | 4 days | 🔲 Todo | Task 3.1 |

**Total Phase Duration: 1-2 weeks**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Task 3.1: Currency Exchange Domain Models

**File:** `src/main/python/models/domain_models.py`

**Estimated Time:** 2 days

### Description
Create domain models for tracking currency exchange gains and losses for tax purposes.

### New Domain Models

#### CurrencyExchange Model
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
```

#### CurrencyGainLoss Model
```python
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
```

#### CurrencyGainLossSummary Model
```python
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
```

#### CurrencyPool Model
```python
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
            'cost_gbp': amount / rate_to_gbp
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
```

### Implementation Details

1. **Create comprehensive currency exchange models**
   - Track currency transactions with full details
   - Support multiple currency pairs
   - Include validation logic

2. **Create currency gain/loss models**
   - Track taxable gains and losses
   - Support different disposal methods (FIFO)
   - Include tax calculation helpers

3. **Create currency summary models**
   - Aggregate gains and losses by tax year
   - Group by currency pair for reporting
   - Calculate net positions

4. **Create currency pool model**
   - Implement FIFO matching logic
   - Track currency purchases and disposals
   - Calculate cost basis accurately

### Files to Update
- `src/main/python/models/domain_models.py` - Add new models

### Test Requirements
- Unit tests for currency exchange calculations
- Exchange rate accuracy tests
- Gain/loss calculation verification
- Summary aggregation tests
- FIFO matching logic tests
- Validation tests for edge cases

### Acceptance Criteria
- [ ] CurrencyExchange model created with validation
- [ ] CurrencyGainLoss model tracks tax implications
- [ ] CurrencyGainLossSummary aggregates correctly
- [ ] CurrencyPool implements FIFO matching
- [ ] All validation logic prevents invalid data
- [ ] Currency pair handling works correctly
- [ ] All unit tests pass

---

## Task 3.2: Currency Exchange Processing Service

**File:** `src/main/python/services/currency_processor.py`

**Estimated Time:** 4 days

### Description
Create a service to process currency exchange transactions and calculate taxable gains/losses using FIFO matching.

### New Service Class

```python
class CurrencyExchangeProcessor:
    """Service for processing currency exchange transactions."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.currency_pools: Dict[str, CurrencyPool] = {}
    
    def process_currency_transactions(
        self, 
        transactions: List[Transaction]
    ) -> List[CurrencyGainLoss]:
        """Process currency exchange transactions for tax purposes."""
        fx_transactions = [
            t for t in transactions 
            if t.transaction_type == TransactionType.CURRENCY_EXCHANGE
        ]
        
        self.logger.info(f"Processing {len(fx_transactions)} currency exchange transactions")
        
        currency_gains_losses = []
        
        # Group transactions by currency pair
        currency_pairs = self._group_by_currency_pair(fx_transactions)
        
        for pair, pair_transactions in currency_pairs.items():
            self.logger.info(f"Processing {len(pair_transactions)} transactions for {pair}")
            
            gains_losses = self._calculate_currency_gains_losses(
                pair, pair_transactions
            )
            currency_gains_losses.extend(gains_losses)
        
        self.logger.info(f"Calculated {len(currency_gains_losses)} currency gain/loss entries")
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
        
        # Extract currencies from pair (e.g., "EUR.GBP" -> "EUR", "GBP")
        currencies = currency_pair.split('.')
        if len(currencies) != 2:
            self.logger.warning(f"Invalid currency pair format: {currency_pair}")
            return gains_losses
        
        from_currency_code = currencies[0]
        to_currency_code = currencies[1]
        
        # Initialize currency pool for the foreign currency
        if from_currency_code not in self.currency_pools:
            self.currency_pools[from_currency_code] = CurrencyPool(from_currency_code)
        
        currency_pool = self.currency_pools[from_currency_code]
        
        for transaction in sorted_transactions:
            try:
                if transaction.quantity > 0:  # Buying foreign currency
                    self._process_currency_purchase(
                        currency_pool, transaction, from_currency_code
                    )
                else:  # Selling foreign currency
                    gain_loss = self._process_currency_disposal(
                        currency_pool, transaction, currency_pair
                    )
                    if gain_loss:
                        gains_losses.append(gain_loss)
            except Exception as e:
                self.logger.error(f"Error processing currency transaction {transaction.id}: {e}")
                # Continue processing other transactions
        
        return gains_losses
    
    def _process_currency_purchase(
        self, 
        currency_pool: CurrencyPool, 
        transaction: Transaction,
        currency_code: str
    ) -> None:
        """Process a currency purchase (add to pool)."""
        amount = transaction.quantity
        rate_to_gbp = transaction.currency.rate_to_base
        
        currency_pool.add_purchase(amount, rate_to_gbp, transaction.date)
        
        self.logger.debug(
            f"Added {amount} {currency_code} to pool at rate {rate_to_gbp} on {transaction.date}"
        )
    
    def _process_currency_disposal(
        self, 
        currency_pool: CurrencyPool, 
        transaction: Transaction,
        currency_pair: str
    ) -> Optional[CurrencyGainLoss]:
        """Process a currency disposal (remove from pool and calculate gain/loss)."""
        disposal_amount = abs(transaction.quantity)
        current_rate = transaction.currency.rate_to_base
        
        try:
            # Get disposal details from pool using FIFO
            disposals = currency_pool.remove_disposal(disposal_amount)
            
            # Calculate total cost basis and proceeds
            total_cost_gbp = sum(d['cost_gbp'] for d in disposals)
            proceeds_gbp = disposal_amount / current_rate
            
            # Calculate gain/loss
            gain_loss_gbp = proceeds_gbp - total_cost_gbp
            
            # Calculate weighted average original rate
            total_amount = sum(d['amount'] for d in disposals)
            weighted_avg_rate = total_amount / total_cost_gbp if total_cost_gbp > 0 else 0
            
            return CurrencyGainLoss(
                currency_pair=currency_pair,
                transaction_date=transaction.date,
                amount_gbp=proceeds_gbp,
                gain_loss_gbp=gain_loss_gbp,
                exchange_rate_used=current_rate,
                exchange_rate_original=weighted_avg_rate,
                disposal_method="FIFO"
            )
            
        except ValueError as e:
            self.logger.error(f"Error processing currency disposal: {e}")
            return None
    
    def calculate_currency_summary(
        self, 
        currency_gains_losses: List[CurrencyGainLoss], 
        tax_year: str
    ) -> CurrencyGainLossSummary:
        """Calculate currency gain/loss summary for a tax year."""
        summary = CurrencyGainLossSummary(tax_year=tax_year)
        
        for gain_loss in currency_gains_losses:
            if self._is_in_tax_year(gain_loss.transaction_date, tax_year):
                summary.add_currency_transaction(gain_loss)
        
        self.logger.info(
            f"Currency summary for {tax_year}: "
            f"{summary.number_of_transactions} transactions, "
            f"£{summary.net_gain_loss:.2f} net gain/loss"
        )
        
        return summary
    
    def _is_in_tax_year(self, date: datetime, tax_year: str) -> bool:
        """Check if a date falls within the specified UK tax year."""
        # UK tax year runs April 6 to April 5
        year_parts = tax_year.split('-')
        start_year = int(year_parts[0])
        
        tax_year_start = datetime(start_year, 4, 6)
        tax_year_end = datetime(start_year + 1, 4, 5)
        
        return tax_year_start <= date <= tax_year_end
    
    def generate_currency_report(
        self, 
        currency_summary: CurrencyGainLossSummary
    ) -> Dict[str, Any]:
        """Generate a comprehensive currency gain/loss report."""
        currency_pairs = currency_summary.get_transactions_by_currency_pair()
        
        pair_summaries = {}
        for pair, transactions in currency_pairs.items():
            pair_gains = sum(t.gain_loss_gbp for t in transactions if t.is_gain)
            pair_losses = sum(abs(t.gain_loss_gbp) for t in transactions if t.is_loss)
            
            pair_summaries[pair] = {
                'transactions': len(transactions),
                'gains': pair_gains,
                'losses': pair_losses,
                'net': pair_gains - pair_losses
            }
        
        return {
            'tax_year': currency_summary.tax_year,
            'total_transactions': currency_summary.number_of_transactions,
            'currency_pairs': currency_summary.number_of_currency_pairs,
            'total_gains': currency_summary.total_gains,
            'total_losses': currency_summary.total_losses,
            'net_gain_loss': currency_summary.net_gain_loss,
            'is_net_gain': currency_summary.is_net_gain,
            'pair_summaries': pair_summaries,
            'gain_transactions': len(currency_summary.get_gains_only()),
            'loss_transactions': len(currency_summary.get_losses_only())
        }
    
    def get_currency_pool_status(self) -> Dict[str, Dict[str, Any]]:
        """Get current status of all currency pools."""
        status = {}
        
        for currency_code, pool in self.currency_pools.items():
            status[currency_code] = {
                'total_amount': pool.total_amount,
                'total_cost_gbp': pool.total_cost_gbp,
                'average_rate': pool.average_rate_to_gbp,
                'entries': len(pool.entries)
            }
        
        return status
    
    def reset_currency_pools(self) -> None:
        """Reset all currency pools (useful for testing)."""
        self.currency_pools.clear()
        self.logger.info("Currency pools reset")
```

### Implementation Details

1. **Process currency exchange transactions from CSV data**
   - Filter transactions by CURRENCY_EXCHANGE type
   - Group by currency pair for processing
   - Handle errors gracefully

2. **Implement FIFO matching for currency disposals**
   - Maintain currency pools for each foreign currency
   - Use FIFO order for disposals
   - Calculate accurate cost basis

3. **Calculate taxable gains/losses on currency exchanges**
   - Compare disposal proceeds vs cost basis
   - Handle multiple disposals from same pool
   - Track exchange rates accurately

4. **Handle multiple currency pairs**
   - Support EUR.GBP, GBP.USD, etc.
   - Maintain separate pools for each currency
   - Aggregate results across all pairs

5. **Track currency positions over time**
   - Maintain running pools of currency holdings
   - Handle complex disposal scenarios
   - Provide pool status reporting

### Files to Create
- `src/main/python/services/currency_processor.py` - Main service class

### Test Requirements
- Unit tests for FIFO currency matching
- Gain/loss calculation accuracy tests
- Multiple currency pair handling tests
- Integration tests with real FX data
- Edge case testing (insufficient funds, zero amounts)
- Currency pool management tests

### Test Data Requirements
- Sample currency exchange transactions
- Multiple currency pairs (EUR.GBP, GBP.USD)
- Complex disposal scenarios
- Edge cases (zero amounts, missing data)
- Real Sharesight FX transaction data

### Acceptance Criteria
- [ ] Currency exchange transactions processed correctly
- [ ] FIFO matching implemented accurately
- [ ] Gains/losses calculated properly
- [ ] Multiple currency pairs supported
- [ ] Currency pools managed correctly
- [ ] Tax year summaries generated
- [ ] Comprehensive reporting available
- [ ] Error handling is robust
- [ ] All tests pass

---

## Dependencies and Prerequisites

### External Dependencies
- No new external dependencies required
- Uses existing Python standard library and project dependencies

### Internal Dependencies
- **Phase 1 complete** - Enhanced transaction types and CSV parser
- Existing domain models (`Transaction`, `Security`, `Currency`)
- Existing test infrastructure

### Data Requirements
- Currency exchange transactions from Sharesight CSV
- Understanding of UK currency gain/loss tax rules
- Exchange rate data from transactions

---

## Testing Strategy

### Unit Tests
- Test currency exchange model validation
- Test FIFO matching logic
- Test gain/loss calculations
- Test currency pool management
- Test summary aggregations

### Integration Tests
- Test with real Sharesight currency data
- Test end-to-end currency processing
- Test with multiple currency pairs and complex scenarios

### Test Data Management
- Create comprehensive currency exchange test scenarios
- Include edge cases and error conditions
- Test with real multi-currency portfolios

---

## Risk Assessment

### High Risk
- **Complex FIFO matching logic** - Mitigation: Thorough testing with known scenarios
- **Exchange rate accuracy** - Mitigation: Use rates from transaction data, validate calculations

### Medium Risk
- **Multiple currency pair complexity** - Mitigation: Separate processing per pair, comprehensive testing
- **Data quality issues** - Mitigation: Robust validation and error handling

### Low Risk
- **Model complexity** - Well-defined domain with clear tax rules

---

## Success Criteria

### Functional Requirements
- [ ] All currency exchange transactions processed correctly
- [ ] FIFO matching works accurately for disposals
- [ ] Gains/losses calculated according to UK tax rules
- [ ] Multiple currency pairs supported
- [ ] Tax year summaries generated correctly
- [ ] Currency pool management works properly

### Non-Functional Requirements
- [ ] Performance acceptable for typical FX transaction volumes
- [ ] Memory usage reasonable for currency pool storage
- [ ] Error handling comprehensive and informative
- [ ] Code coverage > 90% for new code

### Quality Requirements
- [ ] Code follows existing project patterns
- [ ] Comprehensive documentation
- [ ] All tests pass
- [ ] Integration with existing tax calculation

---

## Integration Points

### With Phase 1
- Uses enhanced transaction types (`CURRENCY_EXCHANGE`)
- Relies on improved CSV parser for FX transaction data
- Uses enhanced Currency model

### With Phase 4
- Currency summaries integrate into comprehensive tax calculation
- Provides data for unified tax reporting
- Contributes to total taxable income calculations

### With Phase 5
- Currency effects used in portfolio performance calculations
- FX data contributes to currency effect metrics

---

## Next Steps

After completing Phase 3, the system will have comprehensive currency exchange processing capabilities. This enables:

1. **Phase 4: Enhanced Tax Calculation** - Include currency gains/losses in tax summaries
2. **Phase 5: Portfolio Analytics** - Use currency data for performance metrics
3. **Phase 6: Enhanced Reporting** - Include currency gains/losses in reports

The currency processing service provides essential data for both tax calculation and portfolio performance analysis, particularly for multi-currency portfolios.

---

*Last Updated: 2025-06-24*
