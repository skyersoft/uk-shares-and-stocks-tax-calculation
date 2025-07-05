# Phase 1: Enhanced Transaction Processing Foundation

## Overview

This phase establishes the foundation for processing all transaction types found in Sharesight data. Currently, the system only handles basic stock buy/sell transactions, but the Sharesight CSV contains rich data including dividends, currency exchanges, commissions, and multiple asset classes.

## Goals

1. **Expand transaction type support** - Handle dividends, currency exchanges, commissions
2. **Add asset class support** - Support ETFs, closed-end funds, cash transactions
3. **Enhance CSV parser** - Utilize all available Sharesight data fields
4. **Maintain backward compatibility** - Ensure existing functionality continues to work

---

## Task Tracking

| Task | Description | Estimated Time | Status | Dependencies |
|------|-------------|----------------|--------|--------------|
| 1.1 | Expand Transaction Type Enumeration | 2 days | ✅ Complete | None |
| 1.2 | Enhanced Asset Class Support | 3 days | ✅ Complete | Task 1.1 |
| 1.3 | Enhanced CSV Parser for All Transaction Types | 5 days | ✅ Complete | Tasks 1.1, 1.2 |

**Total Phase Duration: 2-3 weeks**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Task 1.1: Expand Transaction Type Enumeration

**File:** `src/main/python/models/domain_models.py`

**Estimated Time:** 2 days

### Description
Expand the `TransactionType` enum to support all transaction types found in Sharesight data.

### Current State
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

### Required Changes
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

### Implementation Details

1. **Add new enum values** for currency exchanges, interest, commissions
2. **Update validation logic** for each transaction type
3. **Update factory methods** to handle new types
4. **Review all switch/match statements** that use TransactionType

### Files to Update
- `src/main/python/models/domain_models.py` - Add new enum values
- `src/main/python/parsers/transaction_factory.py` - Update factory methods
- `src/main/python/services/disposal_calculator.py` - Handle new types in calculations
- Any other files with TransactionType switch statements

### Test Requirements
- **High-level functional tests** that test library interfaces and business logic
- **Integration tests** with CSV parser to ensure new transaction types are processed correctly
- **Validation tests** for transaction creation and processing workflows
- **Backward compatibility tests** to ensure existing functionality still works
- **Avoid low-level tests** that just check enum values - focus on meaningful functionality

### Test Focus Areas
- Transaction factory can create transactions with new types
- CSV parser can process files with new transaction types
- Transaction validation works correctly for new types
- Business logic handles new transaction types appropriately

### Acceptance Criteria
- [✅] All new transaction types added to enum
- [✅] Factory methods handle new types
- [✅] CSV parser processes new transaction types
- [✅] Validation logic updated
- [✅] All existing tests pass
- [✅] New high-level functional tests written and passing

---

## Task 1.2: Enhanced Asset Class Support

**File:** `src/main/python/models/domain_models.py`

**Estimated Time:** 3 days

### Description
Add support for different asset classes beyond just stocks (STK).

### New Domain Model
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

### Implementation Details

1. **Create AssetClass enum** with all types from Sharesight data
2. **Update Security model** to include asset_class, sub_category, listing_exchange
3. **Add validation logic** for asset class combinations
4. **Update security factory** to set asset class from CSV data
5. **Handle asset class-specific logic** in calculations

### Files to Update
- `src/main/python/models/domain_models.py` - Add AssetClass enum and update Security
- `src/main/python/parsers/security_factory.py` - Update to handle asset classes
- `src/main/python/services/` - Update services to handle different asset classes

### Test Requirements
- Unit tests for each asset class
- Validation tests for asset class/sub-category combinations
- Integration tests with real Sharesight data
- Security factory tests with different asset classes

### Acceptance Criteria
- [✅] AssetClass enum created with all required types
- [✅] Security model updated with new fields
- [✅] Validation logic handles asset class combinations
- [✅] Security factory sets asset class from CSV data
- [✅] All tests pass including new asset class tests

---

## Task 1.3: Enhanced CSV Parser for All Transaction Types

**File:** `src/main/python/parsers/csv_parser.py`

**Estimated Time:** 5 days

### Description
Enhance the CSV parser to handle all transaction types and fields from Sharesight data.

### Current Limitations
- Only processes stock buy/sell transactions
- Ignores currency exchange transactions
- Doesn't capture commission/tax data properly
- Missing dividend processing

### Required Enhancements

#### 1. Transaction Type Mapping
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

#### 2. Enhanced Field Extraction
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

#### 3. Currency Exchange Processing
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

### Implementation Details

1. **Add comprehensive field mapping** from Sharesight CSV columns
2. **Implement transaction type detection logic**
3. **Add currency exchange transaction processing**
4. **Add dividend transaction processing**
5. **Include all fees and commissions** in cost basis calculations
6. **Handle different asset classes** appropriately

### Files to Update
- `src/main/python/parsers/csv_parser.py` - Main parser enhancements
- `src/main/python/parsers/transaction_factory.py` - Handle new transaction types
- `src/main/python/parsers/security_factory.py` - Handle asset classes and exchanges

### Test Requirements
- Unit tests for each transaction type parsing
- Integration tests with real Sharesight CSV data
- Edge case tests for malformed data
- Performance tests with large CSV files
- Backward compatibility tests

### Test Data Requirements
- Create test CSV files for each transaction type
- Use real Sharesight data samples for integration tests
- Create edge case test data (missing fields, malformed data)

### Acceptance Criteria
- [✅] All transaction types from Sharesight CSV are parsed correctly
- [✅] Currency exchange transactions are processed
- [✅] Dividend transactions are processed
- [✅] All fees and commissions are captured
- [✅] Asset class and exchange data is extracted
- [✅] Performance is acceptable with large files
- [✅] All tests pass including edge cases
- [✅] Backward compatibility maintained

---

## Dependencies and Prerequisites

### External Dependencies
- No new external dependencies required
- Uses existing Python standard library and project dependencies

### Internal Dependencies
- Existing domain models (`Transaction`, `Security`, `Currency`)
- Existing parser interfaces
- Existing test infrastructure

### Data Requirements
- Access to real Sharesight CSV data for testing
- Understanding of all Sharesight CSV column meanings
- Sample data for each transaction type

---

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock dependencies where appropriate
- Test edge cases and error conditions
- Verify backward compatibility

### Integration Tests
- Test with real Sharesight CSV files
- Verify end-to-end parsing pipeline
- Test with large datasets for performance

### Test Data Management
- Create comprehensive test CSV files
- Document test data structure and purpose
- Maintain test data in version control

---

## Risk Assessment

### High Risk
- **Breaking existing functionality** - Mitigation: Comprehensive backward compatibility testing
- **Performance degradation** - Mitigation: Performance testing with large datasets

### Medium Risk
- **Complex transaction type mapping** - Mitigation: Thorough testing with real data
- **Data quality issues** - Mitigation: Robust error handling and validation

### Low Risk
- **New enum values** - Well-defined change with clear testing strategy

---

## Success Criteria

### Functional Requirements
- [✅] All Sharesight transaction types are supported
- [✅] Asset class information is captured and used
- [✅] Exchange/market information is available for grouping
- [✅] All fees and commissions are included in calculations
- [✅] Currency exchange transactions are processed

### Non-Functional Requirements
- [✅] Performance is acceptable (< 5 seconds for typical CSV files)
- [✅] Memory usage is reasonable (< 500MB for large files)
- [✅] Error handling is robust and informative
- [✅] Code coverage > 90% for new code

### Quality Requirements
- [✅] Code follows existing project patterns
- [✅] Comprehensive documentation
- [✅] All tests pass
- [✅] No regression in existing functionality

---

## Next Steps

After completing Phase 1, the system will have a solid foundation for processing all transaction types. This enables:

1. **Phase 2: Dividend Processing** - Build on the dividend transaction support
2. **Phase 3: Currency Processing** - Build on the currency exchange support
3. **Phase 5: Portfolio Analytics** - Use asset class and exchange data for grouping

The enhanced CSV parser and transaction type support are prerequisites for most subsequent phases.

---

*Last Updated: 2025-06-24*
