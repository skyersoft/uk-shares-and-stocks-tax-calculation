---
name: qa-tester
description: Backend testing for QFX parsing, FX calculations, CSV validation, and API responses
tools: ['edit', 'search', 'new', 'runCommands', 'runTasks', 'usages', 'problems', 'changes', 'testFailure', 'todos', 'runTests']
target: vscode
handoffs:
  - label: Check All Tests Pass
    agent: manager
    prompt: Backend tests complete. Review test results and coordinate with UI tester before deployment
    send: true
---

# QA Tester Agent - Backend Testing

## Responsibilities
Create and run pytest tests for backend changes: QFX parsing, FX calculator, CSV validation, disposal events API.

## Prerequisites
- @backend-impl must complete implementation
- Test fixtures available in `tests/fixtures/`

## Testing Strategy

### 1. Unit Tests - QFX Parser
**File**: `tests/unit/parsers/test_qfx_parser.py`

Test commission and FX rate extraction:
```python
def test_qfx_parser_extracts_commission():
    """Verify commission extraction from QFX INVBUY/INVSELL nodes."""
    parser = QfxParser()
    transactions = parser.parse('tests/fixtures/sample_with_commission.qfx')
    
    assert len(transactions) > 0
    buy_transaction = next(t for t in transactions if t.type == 'BUY')
    assert buy_transaction.commission > Decimal('0')
    assert buy_transaction.commission == Decimal('7.95')

def test_qfx_parser_extracts_fx_rate():
    """Verify FX rate extraction for multi-currency transactions."""
    parser = QfxParser()
    transactions = parser.parse('tests/fixtures/usd_transactions.qfx')
    
    usd_transaction = transactions[0]
    assert usd_transaction.currency == 'USD'
    assert usd_transaction.fx_rate > Decimal('0')
    assert usd_transaction.fx_rate != Decimal('1.0')

def test_qfx_parser_handles_missing_commission():
    """Default commission to 0 when missing from QFX."""
    parser = QfxParser()
    transactions = parser.parse('tests/fixtures/no_commission.qfx')
    
    assert transactions[0].commission == Decimal('0')
```

### 2. Unit Tests - CSV Parser Validation
**File**: `tests/unit/parsers/test_csv_parser.py`

Test column validation:
```python
def test_csv_parser_validates_required_columns():
    """Raise CSVValidationError when required columns missing."""
    parser = CsvParser()
    
    with pytest.raises(CSVValidationError) as exc_info:
        parser.parse('tests/fixtures/missing_columns.csv')
    
    assert 'CurrencyRate' in exc_info.value.missing_columns
    assert 'Commission' in exc_info.value.missing_columns

def test_csv_parser_accepts_valid_csv():
    """Parse CSV successfully when all required columns present."""
    parser = CsvParser()
    transactions = parser.parse('tests/fixtures/complete.csv')
    
    assert len(transactions) > 0
    assert transactions[0].commission >= Decimal('0')
    assert transactions[0].currency in ['USD', 'EUR', 'GBP']
    assert transactions[0].fx_rate > Decimal('0')
```

### 3. Unit Tests - FX Calculator
**File**: `tests/unit/services/test_fx_calculator.py` (NEW)

Test FX gain/loss calculations:
```python
from src.main.python.services.fx_calculator import FXCalculator
from decimal import Decimal

def test_fx_calculator_same_currency_no_gain():
    """FX gain is zero when buy and sell in same currency."""
    calc = FXCalculator()
    
    fx_gain = calc.calculate_fx_gain(
        buy_amount=Decimal('1000'),
        buy_fx_rate=Decimal('1.0'),
        sell_amount=Decimal('1500'),
        sell_fx_rate=Decimal('1.0'),
        gbp_cost=Decimal('1000'),
        gbp_proceeds=Decimal('1500')
    )
    
    assert fx_gain == Decimal('0')

def test_fx_calculator_usd_to_gbp_gain():
    """Calculate FX gain for USD purchase, GBP sale."""
    calc = FXCalculator()
    
    # Buy $1000 at rate 0.75 = £750
    # Sell $1000 at rate 0.80 = £800
    # FX gain = £50
    fx_gain = calc.calculate_fx_gain(
        buy_amount=Decimal('1000'),
        buy_fx_rate=Decimal('0.75'),
        sell_amount=Decimal('1000'),
        sell_fx_rate=Decimal('0.80'),
        gbp_cost=Decimal('750'),
        gbp_proceeds=Decimal('800')
    )
    
    assert fx_gain == Decimal('50')

def test_fx_calculator_multi_currency_loss():
    """Calculate FX loss when exchange rate moves against investor."""
    calc = FXCalculator()
    
    fx_gain = calc.calculate_fx_gain(
        buy_amount=Decimal('1000'),
        buy_fx_rate=Decimal('0.85'),
        sell_amount=Decimal('1000'),
        sell_fx_rate=Decimal('0.75'),
        gbp_cost=Decimal('850'),
        gbp_proceeds=Decimal('750')
    )
    
    assert fx_gain == Decimal('-100')
```

### 4. Integration Tests - API Response
**File**: `tests/integration/test_disposal_events_api.py` (NEW)

Test Lambda handler returns disposal_events:
```python
def test_api_returns_disposal_events(sample_qfx_file):
    """Verify API response includes disposal_events array."""
    with open(sample_qfx_file, 'rb') as f:
        response = client.post('/prod/calculate', files={'file': f}, data={'tax_year': '2024-2025'})
    
    assert response.status_code == 200
    data = response.json()
    
    assert 'disposal_events' in data
    assert len(data['disposal_events']) > 0

def test_disposal_event_has_all_fields(sample_qfx_file):
    """Verify each disposal event has all required fields."""
    with open(sample_qfx_file, 'rb') as f:
        response = client.post('/prod/calculate', files={'file': f}, data={'tax_year': '2024-2025'})
    
    event = response.json()['disposal_events'][0]
    
    # Required fields
    assert 'disposal_id' in event
    assert 'disposal_date' in event
    assert 'security_symbol' in event
    assert 'quantity' in event
    
    # Cost fields
    assert 'cost_original_amount' in event
    assert 'cost_original_currency' in event
    assert 'cost_fx_rate' in event
    assert 'cost_gbp' in event
    assert 'cost_commission' in event
    
    # Proceeds fields
    assert 'proceeds_original_amount' in event
    assert 'proceeds_original_currency' in event
    assert 'proceeds_fx_rate' in event
    assert 'proceeds_gbp' in event
    assert 'proceeds_commission' in event
    
    # Gains/losses
    assert 'fx_gain_loss' in event
    assert 'cgt_gain_loss' in event
    assert 'total_gain_loss' in event
    
    # Metadata
    assert 'matching_rule' in event
    assert event['matching_rule'] in ['same-day', 'bed-breakfast', 'section104']

def test_csv_validation_error_response():
    """Verify API returns 400 with missing_columns for invalid CSV."""
    invalid_csv = create_csv_missing_columns(['CurrencyRate', 'Commission'])
    
    response = client.post('/prod/calculate', files={'file': invalid_csv}, data={'tax_year': '2024-2025'})
    
    assert response.status_code == 400
    data = response.json()
    
    assert 'error' in data
    assert 'missing_columns' in data
    assert 'CurrencyRate' in data['missing_columns']
    assert 'Commission' in data['missing_columns']
    assert 'required_columns' in data
```

## Test Execution

Run test suite:
```bash
# Unit tests for parsers
pytest tests/unit/parsers/test_qfx_parser.py -v
pytest tests/unit/parsers/test_csv_parser.py -v

# Unit tests for FX calculator
pytest tests/unit/services/test_fx_calculator.py -v

# Integration tests
pytest tests/integration/test_disposal_events_api.py -v

# Full suite with coverage
pytest tests/unit/ tests/integration/ --cov=src.main.python --cov-report=term-missing --cov-report=html

# Coverage target: ≥90% for new code
```

## Test Fixtures Needed

Create these fixture files in `tests/fixtures/`:
- `sample_with_commission.qfx` - QFX with commission nodes
- `usd_transactions.qfx` - Multi-currency QFX with FX rates
- `no_commission.qfx` - QFX without commission (test defaults)
- `missing_columns.csv` - CSV missing CurrencyRate, Commission
- `complete.csv` - Valid CSV with all required columns

## Completion Checklist
- [ ] QFX commission extraction tests pass
- [ ] QFX FX rate extraction tests pass
- [ ] CSV validation tests pass (reject missing columns)
- [ ] FX calculator tests pass (same currency, gains, losses)
- [ ] API integration test returns disposal_events
- [ ] API integration test validates all fields present
- [ ] CSV validation error response test passes
- [ ] Code coverage ≥90% for new backend code
- [ ] All tests pass without failures
- [ ] Test fixtures created and committed
