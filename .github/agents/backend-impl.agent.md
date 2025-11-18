---
name: backend-impl
description: Python backend implementation for disposal tracking, FX calculations, CSV validation
tools: ['edit', 'search', 'runCommands', 'runTasks', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'todos', 'runSubagent', 'runTests']
target: vscode
handoffs:
  - label: Test Backend Changes
    agent: qa-tester
    prompt: Run pytest tests for the backend changes - QFX parsing, FX calculator, CSV validation, and API response
    send: true
---

# Backend Implementation Agent

## Responsibilities
Implement Python backend for detailed disposal tracking with FX/commission calculations and CSV validation.

## Prerequisites
- Wait for @planner to complete API schema definition
- Use the `DisposalEvent` interface as contract

## Implementation Checklist

### 1. QFX Parser Enhancement
**File**: `src/main/python/parsers/qfx_parser.py`

Extract missing transaction fields:
```python
def extract_transaction_fees(self, transaction_node) -> Dict[str, Any]:
    """Extract commission and FX rate from QFX transaction node."""
    return {
        'commission': self._get_decimal_value(transaction_node, 'COMMISSION', 0),
        'currency': self._get_text_value(transaction_node, 'CURRENCY', 'GBP'),
        'fx_rate': self._get_decimal_value(transaction_node, 'CURRATE', 1.0)
    }
```

Update `Transaction` creation to include commission, currency, fx_rate fields.

### 2. CSV Parser Validation
**File**: `src/main/python/parsers/csv_parser.py`

Add validation at parse start:
```python
REQUIRED_CSV_COLUMNS = [
    'Symbol', 'SecurityID', 'SecurityIDType', 'TransactionType',
    'TradeDate', 'Quantity', 'UnitPrice', 'TotalAmount',
    'Currency', 'CurrencyRate', 'Commission'
]

class CSVValidationError(Exception):
    def __init__(self, missing_columns: List[str]):
        self.missing_columns = missing_columns

def parse(self, file_path: str) -> List[Transaction]:
    df = pd.read_csv(file_path)
    missing = [col for col in REQUIRED_CSV_COLUMNS if col not in df.columns]
    if missing:
        raise CSVValidationError(missing_columns=missing)
```

### 3. Domain Model Updates
**File**: `src/main/python/models/domain_models.py`

Extend Transaction and Disposal classes:
```python
@dataclass
class Transaction:
    # ... existing fields ...
    commission: Decimal = Decimal('0')
    currency: str = 'GBP'
    fx_rate: Decimal = Decimal('1.0')

@dataclass
class Disposal:
    # ... existing fields ...
    commission_buy: Decimal = Decimal('0')
    commission_sell: Decimal = Decimal('0')
    cost_currency: str = 'GBP'
    proceeds_currency: str = 'GBP'
    cost_fx_rate: Decimal = Decimal('1.0')
    proceeds_fx_rate: Decimal = Decimal('1.0')
    fx_gain_loss: Decimal = Decimal('0')
    matching_rule: str = 'section104'
```

### 4. FX Calculator Service (NEW FILE)
**File**: `src/main/python/services/fx_calculator.py`

```python
from decimal import Decimal

class FXCalculator:
    """Calculate FX gains/losses for disposals."""
    
    def calculate_fx_gain(
        self,
        buy_amount: Decimal,
        buy_fx_rate: Decimal,
        sell_amount: Decimal,
        sell_fx_rate: Decimal,
        gbp_cost: Decimal,
        gbp_proceeds: Decimal
    ) -> Decimal:
        """Calculate FX gain/loss between acquisition and disposal."""
        if buy_fx_rate == sell_fx_rate == Decimal('1.0'):
            return Decimal('0')
        
        fx_proceeds = sell_amount * sell_fx_rate
        fx_cost = buy_amount * buy_fx_rate
        cgt_gain = gbp_proceeds - gbp_cost
        
        return fx_proceeds - fx_cost - cgt_gain
```

### 5. Disposal Calculator Enhancement
**File**: `src/main/python/services/disposal_calculator.py`

Inject FX calculator, track matching rules:
```python
from .fx_calculator import FXCalculator

class UKDisposalCalculator(DisposalCalculatorInterface):
    def __init__(self):
        self.fx_calculator = FXCalculator()
    
    def calculate_disposal(
        self,
        sell_transaction: Transaction,
        matched_buys: List[Transaction],
        matching_rule: str  # NEW parameter from matcher
    ) -> Disposal:
        # ... existing cost/proceeds calculation ...
        
        fx_gain = self.fx_calculator.calculate_fx_gain(...)
        
        return Disposal(
            # ... existing fields ...
            commission_buy=buy_transaction.commission,
            commission_sell=sell_transaction.commission,
            cost_currency=buy_transaction.currency,
            proceeds_currency=sell_transaction.currency,
            cost_fx_rate=buy_transaction.fx_rate,
            proceeds_fx_rate=sell_transaction.fx_rate,
            fx_gain_loss=fx_gain,
            matching_rule=matching_rule
        )
```

### 6. Transaction Matcher Update
**File**: `src/main/python/services/transaction_matcher.py`

Return matching rule identifier:
```python
def match_disposals(self, transactions: List[Transaction]) -> List[Tuple[Transaction, List[Transaction], str]]:
    """Match disposals and return (sell, buys, matching_rule)."""
    results = []
    for sell in sells:
        # Same-day matching
        same_day = self._find_same_day_acquisitions(sell, buys)
        if same_day:
            results.append((sell, same_day, 'same-day'))
            continue
        
        # 30-day bed & breakfast
        bb = self._find_bed_breakfast_acquisitions(sell, buys)
        if bb:
            results.append((sell, bb, 'bed-breakfast'))
            continue
        
        # Section 104 pool
        pool = self._match_from_pool(sell, buys)
        results.append((sell, pool, 'section104'))
    
    return results
```

### 7. Lambda Handler Updates
**File**: `deployment/lambda_handler.py`

Handle CSV validation errors, serialize disposal_events:
```python
from main.python.parsers.csv_parser import CSVValidationError, REQUIRED_CSV_COLUMNS

try:
    calculator = create_enhanced_calculator(file_path, tax_year, file_type)
    results = calculator.calculate()
except CSVValidationError as e:
    return {
        'statusCode': 400,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': 'Invalid CSV format',
            'message': 'Missing required columns',
            'missing_columns': e.missing_columns,
            'required_columns': REQUIRED_CSV_COLUMNS
        })
    }

# Serialize disposal events
disposal_events = [
    {
        'disposal_id': str(i),
        'disposal_date': d.date.isoformat(),
        'security_symbol': d.security.symbol,
        'security_name': d.security.name,
        'quantity': float(d.quantity),
        'cost_original_amount': float(d.cost_basis / d.cost_fx_rate),
        'cost_original_currency': d.cost_currency,
        'cost_fx_rate': float(d.cost_fx_rate),
        'cost_gbp': float(d.cost_basis),
        'cost_commission': float(d.commission_buy),
        'acquisition_date': d.acquisition_date.isoformat() if hasattr(d, 'acquisition_date') else None,
        'proceeds_original_amount': float(d.proceeds / d.proceeds_fx_rate),
        'proceeds_original_currency': d.proceeds_currency,
        'proceeds_fx_rate': float(d.proceeds_fx_rate),
        'proceeds_gbp': float(d.proceeds),
        'proceeds_commission': float(d.commission_sell),
        'fx_gain_loss': float(d.fx_gain_loss),
        'cgt_gain_loss': float(d.gain_loss),
        'total_gain_loss': float(d.gain_loss + d.fx_gain_loss),
        'matching_rule': d.matching_rule,
        'allowable_cost': float(d.allowable_cost),
        'net_proceeds': float(d.proceeds - d.commission_sell)
    }
    for i, d in enumerate(results.disposals, 1)
]

response_body['disposal_events'] = disposal_events
```

## Testing Before Completion

Run these commands:
```bash
# Unit tests for new code
pytest tests/unit/parsers/test_qfx_parser.py -v -k commission
pytest tests/unit/services/test_fx_calculator.py -v
pytest tests/unit/parsers/test_csv_parser.py -v -k validation

# Integration tests
pytest tests/integration/ -v

# Coverage check (target: 90%+)
pytest tests/unit/ --cov=src.main.python --cov-report=term-missing
```

All tests must pass before handing off to @qa-tester.

## Completion Checklist
- [ ] QFX parser extracts commission, currency, FX rate
- [ ] CSV parser validates required columns
- [ ] CSVValidationError exception created
- [ ] FXCalculator service implemented
- [ ] Disposal model extended with new fields
- [ ] Transaction matcher returns matching rules
- [ ] Disposal calculator uses FX calculator
- [ ] Lambda handler serializes disposal_events
- [ ] Lambda handler returns 400 for invalid CSV
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Code coverage ≥90%
