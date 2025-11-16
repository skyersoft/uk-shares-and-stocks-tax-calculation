# UI Enhancement Tasks for IBKR Tax Calculator

## Executive Summary

Transform the current single-broker, simplified tax calculator into a comprehensive UK tax calculation tool supporting multiple income sources, multiple brokers, and accurate progressive tax calculations.

---

## Current State Analysis

### ✅ What Works Well
- Single broker file upload and processing (IBKR QFX, multi-broker CSV)
- Comprehensive capital gains calculation with Section 104 pooling
- Dividend tracking with withholding tax
- Portfolio analysis with unrealized gains
- Clear results visualization
- Basic additional income entry on results page
- Good error handling and user feedback
- Responsive, modern UI with Bootstrap components

### ❌ Major Gaps

#### Multi-Broker Support
- Cannot upload multiple broker files in single calculation
- No transaction consolidation across brokers
- No broker identification in results

#### Comprehensive Income Handling
- No proper employment income tax calculation
- No tax band determination
- No personal allowance tracking
- No rental income support
- No savings interest support
- No pension contribution impact

#### Tax Calculation Sophistication
- Additional income uses flat tax rates (not progressive bands)
- No Scottish tax rate support
- No marriage allowance
- No carried-forward losses

#### Advanced Features
- No multi-year analysis
- No tax planning scenarios
- No "what-if" calculations
- No export to HMRC Self Assessment format
- No data persistence (login/accounts)

---

## Implementation Tasks

### Phase 1: Multi-Step Wizard Foundation

#### Task 1.1: Create Multi-Step Calculator Component
**Priority:** HIGH  
**Estimated Effort:** 3-4 hours  
**Files:**
- `frontend/src/components/calculator/MultiStepCalculator.tsx` (NEW)
- `frontend/src/components/calculator/ProgressIndicator.tsx` (NEW)
- `frontend/src/pages/CalculatorPage.tsx` (MODIFY)

**Requirements:**
- Create wizard component with 4 steps:
  1. Income Sources Selection
  2. File Uploads & Manual Entries
  3. Personal Tax Details
  4. Review & Calculate
- Add visual progress indicator (step 1 of 4, 2 of 4, etc.)
- Implement navigation: Next, Previous, Review buttons
- Add state management for wizard data
- Validate each step before allowing progression
- Save step data in context/local state

**Acceptance Criteria:**
- User can navigate between steps
- Progress indicator shows current step
- Data persists when moving between steps
- Cannot proceed to next step without completing current step

---

#### Task 1.2: Income Sources Selection Step
**Priority:** HIGH  
**Estimated Effort:** 2-3 hours  
**Files:**
- `frontend/src/components/calculator/steps/IncomeSourcesStep.tsx` (NEW)
- `frontend/src/types/calculator.ts` (NEW/MODIFY)

**Requirements:**
- Checkbox selection for income sources:
  - ✓ Investment Portfolio (broker files)
  - ✓ Employment Income
  - ✓ Self-Employment Income
  - ✓ Dividend Income (other sources)
  - ✓ Rental Income
  - ✓ Savings Interest
  - ✓ Capital Gains (property, crypto, other)
  - ✓ Pension Contributions
- Show/hide subsequent input sections based on selections
- Store selections in wizard state
- Provide helpful tooltips for each option

**Acceptance Criteria:**
- User can select multiple income sources
- Selections control which input forms appear in Step 2
- Tooltips explain what each source includes
- At least one source must be selected

---

### Phase 2: Multi-File Upload & Broker Support

#### Task 2.1: Multi-File Upload Component
**Priority:** HIGH  
**Estimated Effort:** 4-5 hours  
**Files:**
- `frontend/src/components/calculator/MultiFileUpload.tsx` (NEW)
- `frontend/src/components/calculator/BrokerFileItem.tsx` (NEW)
- `frontend/src/types/fileUpload.ts` (NEW)

**Requirements:**
- Support multiple file uploads (drag-drop or click)
- Each file has:
  - File preview (name, size, type)
  - Broker identification dropdown (IBKR, Hargreaves Lansdown, Trading 212, Freetrade, eToro, Vanguard, AJ Bell, Manual CSV)
  - Account name/label (optional)
  - Remove button
- Display list of all uploaded files
- Validate file types (.csv, .qfx, .ofx) and size (10MB per file)
- Visual feedback for drag-over state
- Maximum 10 files per calculation

**Acceptance Criteria:**
- User can upload multiple files
- Each file can be assigned a broker
- Files can be removed individually
- Total size validation works
- Visual feedback during drag operations

---

#### Task 2.2: Backend Multi-File Processing
**Priority:** HIGH  
**Estimated Effort:** 6-8 hours  
**Files:**
- `deployment/api_lambda_handler.py` (MODIFY)
- `src/main/python/services/multi_file_processor.py` (NEW)
- `src/main/python/services/transaction_merger.py` (NEW)

**Requirements:**
- Update API endpoint to accept array of files with metadata
- Process each file with appropriate parser based on broker
- Merge transactions from all files chronologically
- Track broker source for each transaction
- Handle duplicate detection
- Maintain transaction integrity across merges
- Return consolidated results with broker attribution

**Acceptance Criteria:**
- API accepts multiple files in FormData
- Transactions from multiple brokers merge correctly
- Results show which broker each transaction came from
- No duplicate transactions
- Section 104 pools calculated correctly across all brokers

---

### Phase 3: Comprehensive Income Collection

#### Task 3.1: Employment Income Module
**Priority:** HIGH  
**Estimated Effort:** 3-4 hours  
**Files:**
- `frontend/src/components/calculator/income/EmploymentIncome.tsx` (NEW)
- `frontend/src/types/income.ts` (NEW)

**Requirements:**
- Input fields:
  - Gross salary (annual)
  - Bonuses and commissions
  - Benefits in kind (company car, medical insurance, etc.)
  - PAYE tax already paid
  - National Insurance already paid
  - Student loan deductions
  - Pension contributions (employee + employer)
- Validation: numbers only, reasonable ranges
- Help text and examples
- Auto-calculation of net income (informational)

**Acceptance Criteria:**
- All fields accept numeric input with validation
- PAYE/NI fields are optional (estimated if not provided)
- Pension contributions reduce taxable income correctly
- Clear labels and help text

---

#### Task 3.2: Other Income Sources Module
**Priority:** MEDIUM  
**Estimated Effort:** 4-5 hours  
**Files:**
- `frontend/src/components/calculator/income/OtherIncome.tsx` (NEW)
- `frontend/src/components/calculator/income/RentalIncome.tsx` (NEW)
- `frontend/src/components/calculator/income/SavingsInterest.tsx` (NEW)
- `frontend/src/components/calculator/income/OtherCapitalGains.tsx` (NEW)

**Requirements:**

**Rental Income:**
- Gross rental income
- Allowable expenses (mortgage interest, repairs, agent fees)
- Property allowance (£1,000)

**Savings Interest:**
- Interest from banks/building societies
- Personal Savings Allowance awareness (£1,000 basic, £500 higher)

**Other Capital Gains:**
- Property sales (separate from shares)
- Cryptocurrency gains/losses
- Other assets
- Acquisition and disposal dates
- Costs and expenses

**Other Dividends:**
- Dividends from non-portfolio sources
- UK vs foreign dividends

**Acceptance Criteria:**
- Each income type has dedicated form section
- Validation appropriate to income type
- Help text explains allowances
- Calculations preview available

---

#### Task 3.3: Personal Tax Details Step
**Priority:** HIGH  
**Estimated Effort:** 2-3 hours  
**Files:**
- `frontend/src/components/calculator/steps/PersonalDetailsStep.tsx` (NEW)

**Requirements:**
- Tax residency: England/Wales/NI or Scotland
- Date of birth (for age-related allowances)
- Marriage allowance claim (yes/no)
- Blind person's allowance (yes/no)
- Carried-forward losses from previous years
- Tax code (optional, for employed users)
- Self Assessment registration status

**Acceptance Criteria:**
- Scottish tax rates applied when selected
- Marriage allowance validated (income limits)
- Carried losses reduce current year gains
- Optional fields clearly marked

---

### Phase 4: Progressive Tax Calculator Engine

#### Task 4.1: UK Tax Calculation Engine
**Priority:** CRITICAL  
**Estimated Effort:** 8-10 hours  
**Files:**
- `frontend/src/utils/taxCalculator.ts` (NEW)
- `frontend/src/utils/taxBands.ts` (NEW)
- `frontend/src/types/tax.ts` (NEW)

**Requirements:**

**Tax Year 2024-2025 Rates:**
- Personal Allowance: £12,570
- Basic Rate (20%): £12,571 - £50,270
- Higher Rate (40%): £50,271 - £125,140
- Additional Rate (45%): £125,141+

**Dividend Tax:**
- Allowance: £500
- Basic: 8.75%
- Higher: 33.75%
- Additional: 39.35%

**Capital Gains Tax:**
- Annual Exemption: £3,000
- Shares/Investments: 10% (basic), 20% (higher/additional)
- Property: 18% (basic), 24% (higher/additional)

**Scottish Tax Rates (if selected):**
- Starter (19%): £12,571 - £14,876
- Basic (20%): £14,877 - £26,561
- Intermediate (21%): £26,562 - £43,662
- Higher (42%): £43,663 - £125,140
- Top (47%): £125,141+

**Functions Required:**
- `calculateIncomeTax(income, scotland, allowances)` → tax breakdown
- `calculateDividendTax(dividends, otherIncome, allowance)` → tax
- `calculateCapitalGainsTax(gains, otherIncome, annual, residential)` → tax
- `calculateTotalTaxLiability(allIncome)` → comprehensive breakdown
- `determineMarginRate(totalIncome)` → user's tax band

**Acceptance Criteria:**
- Calculations match HMRC rules exactly
- Personal allowance tapers above £100,000
- Dividends use remaining basic rate band
- CGT uses remaining basic rate band
- All allowances applied correctly
- Scottish rates work independently

---

#### Task 4.2: Integration with Results Page
**Priority:** HIGH  
**Estimated Effort:** 3-4 hours  
**Files:**
- `frontend/src/pages/ResultsPage.tsx` (MODIFY)
- `frontend/src/components/results/TaxCalculations.tsx` (MODIFY)
- `frontend/src/components/results/TaxBreakdownBySource.tsx` (NEW)

**Requirements:**
- Replace simplified flat-rate calculations
- Use progressive tax calculator from Task 4.1
- Show which tax band user falls into
- Display marginal vs effective tax rates
- Break down tax by income source:
  - Employment: Income Tax + NI
  - Dividends: Portfolio + Other
  - Capital Gains: Portfolio + Property + Crypto
  - Total Tax Liability
- Color-code tax bands in visualization

**Acceptance Criteria:**
- Tax calculations are accurate to HMRC standards
- User can see which band they're in
- Breakdown by source is clear
- Additional income properly integrated

---

### Phase 5: Enhanced Results & Planning Tools

#### Task 5.1: Tax Breakdown by Source Component
**Priority:** MEDIUM  
**Estimated Effort:** 3-4 hours  
**Files:**
- `frontend/src/components/results/TaxBreakdownBySource.tsx` (NEW)
- `frontend/src/components/results/TaxBandIndicator.tsx` (NEW)

**Requirements:**
- Visual breakdown showing:
  - Total Income: £X (with sub-categories)
  - Taxable Income: £Y (after allowances)
  - Tax Band: Basic/Higher/Additional (with visual indicator)
  - Tax Breakdown by Source (table/chart):
    * Employment Income Tax: £X
    * National Insurance: £X
    * Dividend Tax (Portfolio): £X
    * Dividend Tax (Other): £X
    * Capital Gains Tax (Shares): £X
    * Capital Gains Tax (Property): £X
    * Capital Gains Tax (Other): £X
  - Total Tax Liability: £X
  - Effective Tax Rate: X%
  - Marginal Tax Rate: X%

**Acceptance Criteria:**
- Clear visual hierarchy
- Numbers match calculations exactly
- Tax band indicator prominent
- Responsive on mobile

---

#### Task 5.2: What-If Scenario Planner
**Priority:** LOW  
**Estimated Effort:** 5-6 hours  
**Files:**
- `frontend/src/components/results/WhatIfPlanner.tsx` (NEW)
- `frontend/src/components/results/ScenarioComparison.tsx` (NEW)

**Requirements:**
- Interactive tool on results page
- Adjust inputs to see tax impact:
  - "What if I realize £X more gains?"
  - "What if I defer gains to next year?"
  - "What if I increase pension contributions by £X?"
- Side-by-side comparison: Current vs Scenario
- Show tax savings/increases
- Optimization suggestions:
  - "You can realize £X more in gains tax-free"
  - "Contributing £X to pension saves £Y in tax"
  - "Deferring this sale saves £Z"

**Acceptance Criteria:**
- Real-time calculations as user adjusts
- Comparison view is clear
- Suggestions are actionable
- Does not modify actual results

---

#### Task 5.3: Multi-Year Analysis
**Priority:** LOW  
**Estimated Effort:** 6-8 hours  
**Files:**
- `frontend/src/components/results/MultiYearAnalysis.tsx` (NEW)
- `frontend/src/utils/multiYearCalculator.ts` (NEW)

**Requirements:**
- Allow users to input previous year data
- Track carried-forward losses
- Show year-over-year comparison
- Project future years based on current holdings
- Export multi-year summary

**Acceptance Criteria:**
- Can add previous year calculations
- Losses carry forward correctly
- Visual timeline of tax liability
- Export to CSV/PDF

---

#### Task 5.4: HMRC Export Format
**Priority:** MEDIUM  
**Estimated Effort:** 4-5 hours  
**Files:**
- `frontend/src/utils/hmrcExporter.ts` (NEW)
- `frontend/src/components/results/ExportButtons.tsx` (NEW)

**Requirements:**
- Export calculation results to HMRC-compatible format
- Support Self Assessment supplementary pages:
  - SA100: Main return
  - SA108: Capital Gains summary
  - SA106: Foreign income
- Generate CSV for digital submission
- Generate PDF for records
- Include all transaction details

**Acceptance Criteria:**
- Export matches HMRC field requirements
- PDF is print-ready
- CSV validates with HMRC tools
- Includes all required data

---

### Phase 6: Data Persistence & User Experience

#### Task 6.1: Browser Storage for Calculations
**Priority:** LOW  
**Estimated Effort:** 3-4 hours  
**Files:**
- `frontend/src/utils/localStorage.ts` (NEW)
- `frontend/src/context/CalculationContext.tsx` (MODIFY)

**Requirements:**
- Save calculation results to browser localStorage
- List of saved calculations with metadata:
  - Tax year
  - Calculation date
  - Total tax liability
  - Brief description
- Load previous calculation
- Delete saved calculations
- Export/import calculation data (JSON)
- Privacy notice about local storage

**Acceptance Criteria:**
- Calculations persist across sessions
- User can load previous results
- Data stored locally only (privacy)
- Import/export works

---

#### Task 6.2: Enhanced Mobile Responsiveness
**Priority:** MEDIUM  
**Estimated Effort:** 4-5 hours  
**Files:**
- `frontend/src/components/calculator/MultiStepCalculator.tsx` (MODIFY)
- `frontend/src/styles/mobile.css` (NEW)

**Requirements:**
- Single-column layouts on mobile
- Collapsible sections for complex forms
- Sticky navigation for wizard
- Touch-friendly input controls
- Simplified mobile view option
- Progressive disclosure patterns
- Test on devices: iPhone, Android, tablet

**Acceptance Criteria:**
- All forms usable on mobile
- No horizontal scrolling
- Touch targets ≥44px
- Keyboard behavior correct
- Fast performance on mobile

---

#### Task 6.3: Improved Error Handling & Validation
**Priority:** MEDIUM  
**Estimated Effort:** 2-3 hours  
**Files:**
- `frontend/src/utils/validators.ts` (NEW)
- `frontend/src/components/ui/ErrorBoundary.tsx` (NEW)

**Requirements:**
- Field-level validation with helpful messages
- Real-time validation feedback
- Error boundary for React errors
- Network error retry logic
- Graceful degradation for API failures
- Validation messages in plain English
- Inline help for complex fields

**Acceptance Criteria:**
- Validation prevents invalid submissions
- Error messages are helpful
- App doesn't crash on errors
- Network failures handled gracefully

---

## Testing Requirements

### Unit Tests
- [ ] Tax calculator functions (all calculations)
- [ ] Validators (all input validation)
- [ ] Transaction merger (multi-broker)
- [ ] Results normalizer (data transformation)

### Integration Tests
- [ ] Multi-step wizard flow
- [ ] File upload and processing
- [ ] Tax calculation end-to-end
- [ ] localStorage persistence

### E2E Tests
- [ ] Complete calculation flow: upload → inputs → results
- [ ] Multi-broker scenario
- [ ] Employment + portfolio scenario
- [ ] What-if scenario planner
- [ ] Export functionality

### Browser Testing
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

## Documentation Requirements

- [ ] Update README with new features
- [ ] Create user guide for multi-step wizard
- [ ] Document tax calculation methodology
- [ ] API documentation for multi-file endpoint
- [ ] Privacy policy for local storage
- [ ] FAQ updates for new scenarios

---

## Implementation Priority

### Sprint 1 (Must Have) - 2 weeks
- ✅ Task 1.1: Multi-Step Wizard Foundation
- ✅ Task 1.2: Income Sources Selection
- ✅ Task 2.1: Multi-File Upload Component
- ✅ Task 3.1: Employment Income Module
- ✅ Task 4.1: UK Tax Calculation Engine
- ✅ Task 4.2: Integration with Results Page

### Sprint 2 (Should Have) - 2 weeks
- ✅ Task 2.2: Backend Multi-File Processing
- ✅ Task 3.2: Other Income Sources Module
- ✅ Task 3.3: Personal Tax Details Step
- ✅ Task 5.1: Tax Breakdown by Source Component
- ✅ Task 5.4: HMRC Export Format

### Sprint 3 (Nice to Have) - 1-2 weeks
- ✅ Task 5.2: What-If Scenario Planner
- ✅ Task 5.3: Multi-Year Analysis
- ✅ Task 6.1: Browser Storage
- ✅ Task 6.2: Enhanced Mobile Responsiveness
- ✅ Task 6.3: Improved Error Handling

---

## Success Metrics

- User can complete tax calculation for complex scenarios (multiple brokers + employment)
- Tax calculations accurate to within £1 of HMRC calculators
- Mobile completion rate > 80%
- Time to complete calculation < 10 minutes
- User satisfaction score > 4.5/5
- Error rate < 2%

---

## Risk Assessment

### High Risk
- **Tax calculation accuracy**: Mistakes could lead to user issues with HMRC
  - Mitigation: Extensive testing against HMRC examples, professional review
  
- **Multi-broker transaction merging**: Complex logic with edge cases
  - Mitigation: Comprehensive test suite, duplicate detection

### Medium Risk
- **Backend performance**: Multiple file processing could be slow
  - Mitigation: Optimize parsers, consider async processing
  
- **Mobile UX complexity**: Many form fields difficult on small screens
  - Mitigation: Progressive disclosure, save progress, mobile-first design

### Low Risk
- **Browser compatibility**: Modern features may not work on old browsers
  - Mitigation: Polyfills, graceful degradation, browser detection

---

## Dependencies

- Backend API changes (Task 2.2)
- Tax year data updates (annually)
- HMRC format specifications (for export)
- Testing frameworks setup
- Design review and approval

---

## Notes

- All tax rates are for 2024-2025 tax year
- Scottish tax rates differ from rest of UK
- Personal allowance tapers at £100,000+ income
- Tax calculations should always include disclaimer
- Consider professional tax advisor consultation for complex cases
- Maintain backward compatibility with existing single-file calculations
