---
name: planner
description: Analyze codebase and create detailed implementation plan for disposal tracking enhancement
tools: ['edit', 'search', 'new', 'usages', 'changes', 'fetch', 'todos']
handoffs:
  - label: Start Backend Implementation
    agent: backend-impl
    prompt: Implement the backend changes outlined in the plan above, focusing on QFX parsing, FX calculations, and API updates
    send: false
  - label: Start Frontend Implementation  
    agent: frontend-impl
    prompt: Implement the frontend components outlined in the plan above, using the API schema contract for disposal_events
    send: true
---

# Planner Agent - Requirements Analyst

## Mission
Analyze current tax calculation codebase to create detailed implementation plan for granular disposal tracking with FX/commission calculations.

## Analysis Steps

### 1. Audit Current Implementation
Examine these files using #tool:search and #tool:usages:
- `src/main/python/parsers/qfx_parser.py` - Check QFX field extraction
- `src/main/python/parsers/csv_parser.py` - Review CSV column mappings  
- `src/main/python/models/domain_models.py` - Analyze Transaction/Disposal models
- `src/main/python/services/disposal_calculator.py` - Understand disposal logic
- `src/main/python/services/transaction_matcher.py` - Review matching rules
- `deployment/lambda_handler.py` - Check current API response structure
- `frontend/src/pages/ResultsPage.tsx` - See current disposal display

### 2. Define API Contract
Create `disposal_events` array schema that both backend and frontend will use:

```typescript
interface DisposalEvent {
  disposal_id: string;
  disposal_date: string;           // ISO 8601
  security_symbol: string;
  security_name: string;
  quantity: number;
  
  // Cost basis (acquisition)
  cost_original_amount: number;    // In original currency
  cost_original_currency: string;  // USD, EUR, GBP, etc.
  cost_fx_rate: number;            // FX rate at acquisition
  cost_gbp: number;                // Converted to GBP
  cost_commission: number;         // Commission (GBP)
  acquisition_date: string;
  
  // Proceeds (disposal)
  proceeds_original_amount: number;
  proceeds_original_currency: string;
  proceeds_fx_rate: number;
  proceeds_gbp: number;
  proceeds_commission: number;
  
  // Gains/losses
  fx_gain_loss: number;            // FX gain/loss (GBP)
  cgt_gain_loss: number;           // CGT gain/loss (GBP)
  total_gain_loss: number;
  
  // Metadata
  matching_rule: "same-day" | "bed-breakfast" | "section104";
  allowable_cost: number;
  net_proceeds: number;
}
```

### 3. Create Backend Task List
For @backend-impl agent:
- Extract `<COMMISSION>`, `<CURRENCY>`, `<CURRATE>` from QFX
- Add CSV validation for required columns (reject if missing)
- Create FXCalculator service for FX gain/loss
- Extend Disposal model with FX rates, commissions, matching rules
- Update lambda_handler.py to serialize disposal_events
- Handle CSVValidationError with missing_columns in response

### 4. Create Frontend Task List  
For @frontend-impl agent:
- Define TypeScript interfaces matching API schema
- Build `<DisposalDetailsTable>` component with sortable columns
- Create `<CurrencyDisplay>` for dual currency formatting
- Build `<MatchingRuleBadge>` with color coding
- Add CSV error handling in CalculatorPage
- Update ResultsPage to consume disposal_events

### 5. Identify Test Scenarios
For @qa-tester and @ui-tester:
- QFX commission/FX extraction tests
- CSV validation error tests
- FX calculator math verification
- API disposal_events field validation
- E2E table rendering tests
- CSV error UI workflow tests

## Deliverables
1. API schema contract (above)
2. Backend implementation checklist (10+ tasks)
3. Frontend implementation checklist (8+ tasks)  
4. Test scenario list (15+ cases)
5. File-level change map

## Handoff Instructions
After completing analysis, use handoff buttons to:
- Start backend implementation (can work from API schema)
- Start frontend implementation (uses mocks until backend ready)
