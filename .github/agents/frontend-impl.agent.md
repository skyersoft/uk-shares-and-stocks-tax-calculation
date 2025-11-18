---
name: frontend-impl
description: React/TypeScript implementation for disposal details table and currency display
tools: ['codebase', 'shell']
target: vscode
handoffs:
  - label: Test UI Components
    agent: ui-tester
    prompt: Run Jest and Playwright tests for the new disposal details table, currency display, and CSV error handling
    send: false
---

# Frontend Implementation Agent

## Responsibilities
Build React components for detailed disposal display with dual currency formatting and matching rule badges.

## Prerequisites
- Wait for @planner to provide API schema
- Can start with mocked API responses
- Integrate real API when @backend-impl completes

## Implementation Checklist

### 1. TypeScript Interfaces
**File**: `frontend/src/types/calculation.ts`

Define DisposalEvent interface matching backend schema:
```typescript
export interface DisposalEvent {
  disposal_id: string;
  disposal_date: string;
  security_symbol: string;
  security_name: string;
  quantity: number;
  
  cost_original_amount: number;
  cost_original_currency: string;
  cost_fx_rate: number;
  cost_gbp: number;
  cost_commission: number;
  acquisition_date: string | null;
  
  proceeds_original_amount: number;
  proceeds_original_currency: string;
  proceeds_fx_rate: number;
  proceeds_gbp: number;
  proceeds_commission: number;
  
  fx_gain_loss: number;
  cgt_gain_loss: number;
  total_gain_loss: number;
  
  matching_rule: 'same-day' | 'bed-breakfast' | 'section104';
  allowable_cost: number;
  net_proceeds: number;
}

export interface CalculationResponse {
  // ... existing fields ...
  disposal_events: DisposalEvent[];
}

export interface CSVValidationError {
  error: string;
  message: string;
  missing_columns: string[];
  required_columns: string[];
}
```

### 2. Currency Display Component (NEW)
**File**: `frontend/src/components/common/CurrencyDisplay.tsx`

```typescript
interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  gbpAmount?: number;
  showSymbol?: boolean;
}

export function CurrencyDisplay({ amount, currency, gbpAmount, showSymbol = true }: CurrencyDisplayProps) {
  const symbol = getCurrencySymbol(currency);
  const formatted = formatCurrency(amount, currency);
  
  if (currency === 'GBP' || !gbpAmount) {
    return <span className="currency-display">{formatted}</span>;
  }
  
  return (
    <span className="currency-display dual">
      <span className="original">{symbol}{formatted}</span>
      <span className="converted">(£{formatCurrency(gbpAmount, 'GBP')})</span>
    </span>
  );
}
```

### 3. Matching Rule Badge (NEW)
**File**: `frontend/src/components/common/MatchingRuleBadge.tsx`

```typescript
interface MatchingRuleBadgeProps {
  rule: 'same-day' | 'bed-breakfast' | 'section104';
}

export function MatchingRuleBadge({ rule }: MatchingRuleBadgeProps) {
  const config = {
    'same-day': { label: 'Same Day', variant: 'success', tooltip: 'Shares acquired on same day as disposal' },
    'bed-breakfast': { label: '30-Day B&B', variant: 'warning', tooltip: 'Shares acquired within 30 days after disposal' },
    'section104': { label: 'Section 104 Pool', variant: 'info', tooltip: 'Shares from pooled holdings' }
  };
  
  const { label, variant, tooltip } = config[rule];
  
  return (
    <span className={`badge badge-${variant}`} title={tooltip}>
      {label}
    </span>
  );
}
```

### 4. Disposal Details Table (NEW)
**File**: `frontend/src/components/results/DisposalDetailsTable.tsx`

```typescript
interface DisposalDetailsTableProps {
  disposalEvents: DisposalEvent[];
}

export function DisposalDetailsTable({ disposalEvents }: DisposalDetailsTableProps) {
  const [sortBy, setSortBy] = useState<keyof DisposalEvent>('disposal_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const sorted = useMemo(() => {
    return [...disposalEvents].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [disposalEvents, sortBy, sortOrder]);
  
  return (
    <div className="disposal-details-table">
      <h3>Detailed Disposal Breakdown</h3>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th onClick={() => handleSort('disposal_date')}>Date</th>
            <th onClick={() => handleSort('security_symbol')}>Security</th>
            <th onClick={() => handleSort('quantity')}>Qty</th>
            <th>Cost (Original)</th>
            <th>FX Rate</th>
            <th>Cost (GBP)</th>
            <th>Proceeds (Original)</th>
            <th>FX Rate</th>
            <th>Proceeds (GBP)</th>
            <th>Commission</th>
            <th onClick={() => handleSort('fx_gain_loss')}>FX Gain/Loss</th>
            <th onClick={() => handleSort('cgt_gain_loss')}>CGT Gain/Loss</th>
            <th>Matching Rule</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(event => (
            <tr key={event.disposal_id}>
              <td>{formatDate(event.disposal_date)}</td>
              <td>{event.security_symbol}</td>
              <td>{event.quantity}</td>
              <td>
                <CurrencyDisplay 
                  amount={event.cost_original_amount} 
                  currency={event.cost_original_currency}
                  gbpAmount={event.cost_gbp}
                />
              </td>
              <td>{event.cost_fx_rate.toFixed(4)}</td>
              <td>£{formatCurrency(event.cost_gbp, 'GBP')}</td>
              <td>
                <CurrencyDisplay 
                  amount={event.proceeds_original_amount} 
                  currency={event.proceeds_original_currency}
                  gbpAmount={event.proceeds_gbp}
                />
              </td>
              <td>{event.proceeds_fx_rate.toFixed(4)}</td>
              <td>£{formatCurrency(event.proceeds_gbp, 'GBP')}</td>
              <td>£{formatCurrency(event.cost_commission + event.proceeds_commission, 'GBP')}</td>
              <td className={event.fx_gain_loss >= 0 ? 'text-success' : 'text-danger'}>
                £{formatCurrency(event.fx_gain_loss, 'GBP')}
              </td>
              <td className={event.cgt_gain_loss >= 0 ? 'text-success' : 'text-danger'}>
                £{formatCurrency(event.cgt_gain_loss, 'GBP')}
              </td>
              <td>
                <MatchingRuleBadge rule={event.matching_rule} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. Currency Utilities (NEW)
**File**: `frontend/src/utils/currency.ts`

```typescript
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF ',
  CAD: 'C$',
  AUD: 'A$'
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency + ' ';
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDualCurrency(
  amount: number,
  currency: string,
  gbpAmount: number
): string {
  if (currency === 'GBP') {
    return `£${formatCurrency(amount, 'GBP')}`;
  }
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatCurrency(amount, currency)} (£${formatCurrency(gbpAmount, 'GBP')})`;
}
```

### 6. Results Page Update
**File**: `frontend/src/pages/ResultsPage.tsx`

Import and render DisposalDetailsTable:
```typescript
import { DisposalDetailsTable } from '../components/results/DisposalDetailsTable';

function ResultsPage() {
  const { results } = useCalculationResults();
  
  return (
    <div className="results-page">
      {/* ... existing summary sections ... */}
      
      {results.disposal_events && results.disposal_events.length > 0 && (
        <section className="disposal-details-section">
          <DisposalDetailsTable disposalEvents={results.disposal_events} />
        </section>
      )}
      
      {/* ... existing portfolio/dividend sections ... */}
    </div>
  );
}
```

### 7. Calculator Page Error Handling
**File**: `frontend/src/pages/CalculatorPage.tsx`

Handle CSV validation errors:
```typescript
async function handleFileUpload(file: File) {
  try {
    const response = await submitCalculation({ file, taxYear, analysisType });
    setResults(response);
  } catch (error) {
    if (error.response?.status === 400) {
      const errorData: CSVValidationError = await error.response.json();
      if (errorData.missing_columns) {
        setError({
          message: `Missing CSV columns: ${errorData.missing_columns.join(', ')}`,
          details: `Required columns: ${errorData.required_columns.join(', ')}`,
          type: 'validation'
        });
        return;
      }
    }
    setError({ message: error.message, type: 'general' });
  }
}

// In JSX:
{error && error.type === 'validation' && (
  <Alert variant="danger">
    <h5>Invalid CSV Format</h5>
    <p>{error.message}</p>
    <p className="text-muted">{error.details}</p>
    <a href="/guide#csv-format">View CSV format requirements</a>
  </Alert>
)}
```

## Testing Before Completion

Run these commands:
```bash
# Jest unit tests for components
npm run test:unit -- DisposalDetailsTable CurrencyDisplay MatchingRuleBadge

# Build test
npm run build:spa

# Dev server check
npm run dev:spa
```

All tests must pass before handing off to @ui-tester.

## Completion Checklist
- [ ] TypeScript interfaces defined for DisposalEvent
- [ ] CurrencyDisplay component created
- [ ] MatchingRuleBadge component created
- [ ] DisposalDetailsTable component with sorting
- [ ] Currency utility functions implemented
- [ ] ResultsPage renders disposal details table
- [ ] CalculatorPage handles CSV validation errors
- [ ] Jest tests pass for new components
- [ ] Build completes without errors
- [ ] Dev server runs successfully
