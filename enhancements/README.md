# UK Capital Gains Tax Calculator - Enhancement Project

## Overview

This directory contains the comprehensive enhancement plan to transform the current basic capital gains calculator into a full-featured tax calculation and portfolio management system. The enhancements are based on analysis of the Sharesight.csv data which contains rich transaction data including dividends, currency exchanges, commissions, and multiple asset classes.

## Project Structure

```
enhancements/
├── README.md                    # This file - project overview and tracking
├── phase-1-foundation.md        # Enhanced transaction processing foundation
├── phase-2-dividends.md         # Dividend income processing
├── phase-3-currency.md          # Currency exchange gain/loss processing
├── phase-4-tax-calculation.md   # Comprehensive tax calculation enhancement
├── phase-5-portfolio.md         # Portfolio holdings and performance analytics
├── phase-6-reporting.md         # Enhanced reporting and web interface
└── phase-7-integration.md       # Integration and testing
```

## Current System Limitations

1. **Only processes stock buy/sell transactions** - Ignores dividends, currency exchanges, fees
2. **Missing transaction types** - No support for FX gains/losses, dividend income, commissions
3. **Incomplete cost basis calculation** - Doesn't include all allowable costs
4. **No portfolio view** - Only shows disposed positions, not current holdings
5. **No market grouping** - Doesn't utilize exchange/market data for organization
6. **No performance metrics** - Missing dividend yields, currency effects, total returns

## Target Outcome

Transform the system to produce a comprehensive portfolio view matching the desired format:
- **Market-grouped holdings** (EURONEXT, LSE, NASDAQ, NYSE)
- **Performance metrics** (Capital Gains %, Dividends %, Currency %, Return %)
- **Current portfolio values** with quantity, price, and total value
- **Comprehensive tax calculation** including all income types

---

## High-Level Task Tracking

| Phase | Description | Duration | Status | Dependencies |
|-------|-------------|----------|--------|--------------|
| 1 | Enhanced Transaction Processing Foundation | 2-3 weeks | 🔲 Todo | None |
| 2 | Dividend Income Processing | 1-2 weeks | 🔲 Todo | Phase 1 |
| 3 | Currency Exchange Gain/Loss Processing | 1-2 weeks | 🔲 Todo | Phase 1 |
| 4 | Comprehensive Tax Calculation Enhancement | 1 week | 🔲 Todo | Phases 2,3 |
| 5 | Portfolio Holdings and Performance Analytics | 2-3 weeks | 🔲 Todo | Phase 1 |
| 6 | Enhanced Reporting and Web Interface | 1-2 weeks | 🔲 Todo | Phases 4,5 |
| 7 | Integration and Testing | 1 week | 🔲 Todo | All phases |

**Total Estimated Timeline: 8-12 weeks**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Phase Summaries

### Phase 1: Enhanced Transaction Processing Foundation
**Goal:** Expand the system to handle all transaction types found in Sharesight data.

**Key Deliverables:**
- Enhanced TransactionType enum (dividends, currency exchanges, commissions)
- Asset class support (ETF, CLOSED-END FUND, CASH)
- Comprehensive CSV parser utilizing all Sharesight fields

**Files:** `phase-1-foundation.md`

---

### Phase 2: Dividend Income Processing
**Goal:** Add comprehensive dividend income tracking and tax calculation.

**Key Deliverables:**
- Dividend income domain models
- Dividend processing service
- Tax year dividend summaries

**Files:** `phase-2-dividends.md`

---

### Phase 3: Currency Exchange Gain/Loss Processing
**Goal:** Implement currency exchange transaction processing for tax purposes.

**Key Deliverables:**
- Currency exchange domain models
- FIFO matching for FX gains/losses
- Currency gain/loss tax summaries

**Files:** `phase-3-currency.md`

---

### Phase 4: Comprehensive Tax Calculation Enhancement
**Goal:** Integrate all income types into unified tax calculation.

**Key Deliverables:**
- Enhanced tax year calculator
- Comprehensive tax summary model
- Complete cost basis calculations

**Files:** `phase-4-tax-calculation.md`

---

### Phase 5: Portfolio Holdings and Performance Analytics
**Goal:** Calculate current portfolio holdings and performance metrics.

**Key Deliverables:**
- Portfolio holdings calculator
- Performance metrics calculator
- Market grouping functionality

**Files:** `phase-5-portfolio.md`

---

### Phase 6: Enhanced Reporting and Web Interface
**Goal:** Create portfolio view matching the desired output format.

**Key Deliverables:**
- Portfolio report generator
- Enhanced web templates
- New portfolio routes and APIs

**Files:** `phase-6-reporting.md`

---

### Phase 7: Integration and Testing
**Goal:** Integrate all components and ensure system reliability.

**Key Deliverables:**
- Enhanced main calculator integration
- Comprehensive test suite
- Performance optimization

**Files:** `phase-7-integration.md`

---

## Success Criteria

### 1. Comprehensive Tax Calculation
- ✅ All transaction types processed correctly
- ✅ Dividend income calculated and reported
- ✅ Currency exchange gains/losses included
- ✅ All allowable costs properly included

### 2. Portfolio View
- ✅ Current holdings calculated accurately
- ✅ Holdings grouped by market/exchange
- ✅ Performance metrics displayed (capital gains %, dividends %, currency %, total return %)
- ✅ Matches the desired output format from the provided image

### 3. Data Accuracy
- ✅ All calculations verified against manual calculations
- ✅ Integration tests pass with real Sharesight data
- ✅ No regression in existing functionality

### 4. User Experience
- ✅ Intuitive web interface
- ✅ Fast performance with large datasets
- ✅ Clear error messages and validation
- ✅ Export functionality for reports

### 5. Code Quality
- ✅ Comprehensive test coverage (>90%)
- ✅ Clean, maintainable code following SOLID principles
- ✅ Proper error handling and logging
- ✅ Documentation for all new components

---

## Getting Started

1. **Review Phase 1** - Start with `phase-1-foundation.md` to understand the foundational changes
2. **Check Dependencies** - Each phase file lists its dependencies and prerequisites
3. **Track Progress** - Update the status in this file as tasks are completed
4. **Follow Order** - Phases should generally be completed in order due to dependencies

## Notes

- Each phase file contains detailed task breakdowns with implementation specifications
- Code examples and templates are provided for complex implementations
- Test requirements are specified for each task
- All phases include comprehensive error handling and logging requirements

---

*Last Updated: 2025-06-24*
