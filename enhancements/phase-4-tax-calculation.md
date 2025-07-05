# Phase 4: Comprehensive Tax Calculation Enhancement

## Overview

This phase integrates all income types (capital gains, dividends, currency gains) into a unified tax calculation system. It enhances the existing tax year calculator to include comprehensive cost basis calculations and generates unified tax summaries that combine all taxable income sources.

## Goals

1. **Enhance tax year calculator** - Include all income types in tax calculations
2. **Create comprehensive tax summary** - Unified model for all income types
3. **Calculate total allowable costs** - Include all fees, commissions, and allowable expenses
4. **Generate unified tax reports** - Complete tax summaries for reporting

---

## Task Tracking

| Task | Description | Estimated Time | Status | Dependencies |
|------|-------------|----------------|--------|--------------|
| 4.1 | Enhanced Tax Year Calculator | 3 days | 🔲 Todo | Phases 2,3 complete |
| 4.2 | Comprehensive Tax Summary Domain Model | 2 days | 🔲 Todo | Task 4.1 |

**Total Phase Duration: 1 week**

### Status Legend
- 🔲 Todo
- 🔄 In Progress  
- ✅ Complete
- ⚠️ Blocked

---

## Task 4.1: Enhanced Tax Year Calculator

**File:** `src/main/python/services/tax_year_calculator.py`

**Estimated Time:** 3 days

### Description
Enhance the existing tax year calculator to include dividends, currency gains, and comprehensive cost basis calculations.

### Enhanced Tax Year Calculator

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
        
        self.logger.info(f"Calculating comprehensive tax summary for {tax_year}")
        
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
        total_costs = self._calculate_total_allowable_costs(transactions, tax_year)
        
        # Calculate total taxable income
        total_taxable_income = self._calculate_total_taxable_income(
            capital_gains_summary, dividend_summary, currency_summary
        )
        
        comprehensive_summary = ComprehensiveTaxSummary(
            tax_year=tax_year,
            capital_gains=capital_gains_summary,
            dividend_income=dividend_summary,
            currency_gains=currency_summary,
            total_allowable_costs=total_costs,
            total_taxable_income=total_taxable_income
        )
        
        # Calculate tax allowances used
        self._calculate_allowances_used(comprehensive_summary)
        
        self.logger.info(
            f"Comprehensive tax summary completed: "
            f"£{total_taxable_income:.2f} total taxable income"
        )
        
        return comprehensive_summary
    
    def _calculate_capital_gains(
        self, 
        transactions: List[Transaction], 
        tax_year: str
    ) -> TaxYearSummary:
        """Calculate capital gains using existing disposal calculator."""
        # Filter stock transactions only
        stock_transactions = [
            t for t in transactions 
            if t.transaction_type in [TransactionType.BUY, TransactionType.SELL]
        ]
        
        # Use existing disposal calculator
        disposals = self.disposal_calculator.calculate_disposals(stock_transactions)
        
        # Filter disposals by tax year and calculate summary
        tax_year_disposals = [
            d for d in disposals 
            if self._is_in_tax_year(d.disposal_date, tax_year)
        ]
        
        return self._create_capital_gains_summary(tax_year_disposals, tax_year)
    
    def _calculate_currency_summary(
        self, 
        currency_gains_losses: List[CurrencyGainLoss], 
        tax_year: str
    ) -> CurrencyGainLossSummary:
        """Calculate currency summary for the tax year."""
        return self.currency_processor.calculate_currency_summary(
            currency_gains_losses, tax_year
        )
    
    def _calculate_total_allowable_costs(
        self, 
        transactions: List[Transaction], 
        tax_year: str
    ) -> float:
        """Calculate total allowable costs including all fees and commissions."""
        total_costs = 0.0
        
        for transaction in transactions:
            if self._is_in_tax_year(transaction.date, tax_year):
                # Include commissions
                if hasattr(transaction, 'commission_in_base_currency'):
                    total_costs += transaction.commission_in_base_currency
                
                # Include taxes (where allowable)
                if hasattr(transaction, 'taxes_in_base_currency'):
                    total_costs += transaction.taxes_in_base_currency
                
                # Include other allowable costs
                # (stamp duty, transfer fees, etc.)
                if hasattr(transaction, 'other_fees_in_base_currency'):
                    total_costs += transaction.other_fees_in_base_currency
        
        self.logger.info(f"Total allowable costs for {tax_year}: £{total_costs:.2f}")
        return total_costs
    
    def _calculate_total_taxable_income(
        self,
        capital_gains: TaxYearSummary,
        dividends: DividendSummary,
        currency_gains: CurrencyGainLossSummary
    ) -> float:
        """Calculate total taxable income from all sources."""
        
        # Capital gains (after allowance)
        capital_gains_taxable = max(0, capital_gains.taxable_gain) if capital_gains else 0.0
        
        # Dividend income (after allowance)
        dividend_taxable = dividends.taxable_dividend_income if dividends else 0.0
        
        # Currency gains (only gains, losses can offset)
        currency_taxable = max(0, currency_gains.net_gain_loss) if currency_gains else 0.0
        
        total = capital_gains_taxable + dividend_taxable + currency_taxable
        
        self.logger.info(
            f"Taxable income breakdown: "
            f"Capital gains: £{capital_gains_taxable:.2f}, "
            f"Dividends: £{dividend_taxable:.2f}, "
            f"Currency: £{currency_taxable:.2f}, "
            f"Total: £{total:.2f}"
        )
        
        return total
    
    def _calculate_allowances_used(
        self, 
        comprehensive_summary: ComprehensiveTaxSummary
    ) -> None:
        """Calculate tax allowances used."""
        
        # UK tax allowances for 2024-25 (make configurable in future)
        CGT_ALLOWANCE = 3000.0  # Reduced from £6,000 in 2023-24
        DIVIDEND_ALLOWANCE = 500.0  # Reduced from £1,000 in 2023-24
        
        # Capital gains allowance
        if comprehensive_summary.capital_gains:
            cgt_gain = comprehensive_summary.capital_gains.total_gain
            comprehensive_summary.capital_gains_allowance_used = min(cgt_gain, CGT_ALLOWANCE)
        
        # Dividend allowance
        if comprehensive_summary.dividend_income:
            dividend_income = comprehensive_summary.dividend_income.total_net_gbp
            comprehensive_summary.dividend_allowance_used = min(dividend_income, DIVIDEND_ALLOWANCE)
        
        # Currency gains (no specific allowance, but losses can offset gains)
        if comprehensive_summary.currency_gains:
            comprehensive_summary.currency_gains_allowance_used = 0.0
    
    def _create_capital_gains_summary(
        self, 
        disposals: List[Disposal], 
        tax_year: str
    ) -> TaxYearSummary:
        """Create capital gains summary from disposals."""
        total_proceeds = sum(d.proceeds for d in disposals)
        total_cost = sum(d.cost for d in disposals)
        total_gain = total_proceeds - total_cost
        
        # Apply CGT allowance
        CGT_ALLOWANCE = 3000.0  # 2024-25 rate
        taxable_gain = max(0, total_gain - CGT_ALLOWANCE)
        
        return TaxYearSummary(
            tax_year=tax_year,
            disposals=disposals,
            total_proceeds=total_proceeds,
            total_cost=total_cost,
            total_gain=total_gain,
            taxable_gain=taxable_gain
        )
    
    def _is_in_tax_year(self, date: datetime, tax_year: str) -> bool:
        """Check if a date falls within the specified UK tax year."""
        # UK tax year runs April 6 to April 5
        year_parts = tax_year.split('-')
        start_year = int(year_parts[0])
        
        tax_year_start = datetime(start_year, 4, 6)
        tax_year_end = datetime(start_year + 1, 4, 5)
        
        return tax_year_start <= date <= tax_year_end
    
    def generate_tax_calculation_report(
        self, 
        comprehensive_summary: ComprehensiveTaxSummary
    ) -> Dict[str, Any]:
        """Generate detailed tax calculation report."""
        
        return {
            'tax_year': comprehensive_summary.tax_year,
            'capital_gains': {
                'total_gain': comprehensive_summary.capital_gains.total_gain if comprehensive_summary.capital_gains else 0.0,
                'allowance_used': comprehensive_summary.capital_gains_allowance_used,
                'taxable_gain': comprehensive_summary.capital_gains.taxable_gain if comprehensive_summary.capital_gains else 0.0,
                'number_of_disposals': len(comprehensive_summary.capital_gains.disposals) if comprehensive_summary.capital_gains else 0
            },
            'dividend_income': {
                'total_gross': comprehensive_summary.dividend_income.total_gross_gbp if comprehensive_summary.dividend_income else 0.0,
                'total_net': comprehensive_summary.dividend_income.total_net_gbp if comprehensive_summary.dividend_income else 0.0,
                'allowance_used': comprehensive_summary.dividend_allowance_used,
                'taxable_income': comprehensive_summary.dividend_income.taxable_dividend_income if comprehensive_summary.dividend_income else 0.0,
                'withholding_tax': comprehensive_summary.dividend_income.total_withholding_tax_gbp if comprehensive_summary.dividend_income else 0.0
            },
            'currency_gains': {
                'total_gains': comprehensive_summary.currency_gains.total_gains if comprehensive_summary.currency_gains else 0.0,
                'total_losses': comprehensive_summary.currency_gains.total_losses if comprehensive_summary.currency_gains else 0.0,
                'net_gain_loss': comprehensive_summary.currency_gains.net_gain_loss if comprehensive_summary.currency_gains else 0.0,
                'taxable_amount': max(0, comprehensive_summary.currency_gains.net_gain_loss) if comprehensive_summary.currency_gains else 0.0
            },
            'summary': {
                'total_allowable_costs': comprehensive_summary.total_allowable_costs,
                'total_taxable_income': comprehensive_summary.total_taxable_income,
                'estimated_tax_liability': self._estimate_tax_liability(comprehensive_summary)
            }
        }
    
    def _estimate_tax_liability(
        self, 
        comprehensive_summary: ComprehensiveTaxSummary
    ) -> Dict[str, float]:
        """Estimate tax liability (simplified calculation)."""
        
        # This is a simplified calculation - real implementation would need
        # to consider individual tax bands, rates, and circumstances
        
        # Basic rate CGT: 10% (18% for residential property)
        # Higher rate CGT: 20% (28% for residential property)
        # Dividend tax rates: 8.75% basic, 33.75% higher, 39.35% additional
        
        cgt_taxable = comprehensive_summary.capital_gains.taxable_gain if comprehensive_summary.capital_gains else 0.0
        dividend_taxable = comprehensive_summary.dividend_income.taxable_dividend_income if comprehensive_summary.dividend_income else 0.0
        currency_taxable = max(0, comprehensive_summary.currency_gains.net_gain_loss) if comprehensive_summary.currency_gains else 0.0
        
        # Assume basic rate for simplicity
        estimated_cgt_tax = cgt_taxable * 0.10  # 10% basic rate
        estimated_dividend_tax = dividend_taxable * 0.0875  # 8.75% basic rate
        estimated_currency_tax = currency_taxable * 0.10  # Treated as capital gains
        
        return {
            'capital_gains_tax': estimated_cgt_tax,
            'dividend_tax': estimated_dividend_tax,
            'currency_gains_tax': estimated_currency_tax,
            'total_estimated_tax': estimated_cgt_tax + estimated_dividend_tax + estimated_currency_tax
        }
```

### Implementation Details

1. **Integrate all income types into single tax calculation**
   - Use existing disposal calculator for capital gains
   - Integrate dividend processor for dividend income
   - Integrate currency processor for FX gains/losses

2. **Include comprehensive cost basis calculations**
   - Sum all commissions, taxes, and fees
   - Include allowable costs in tax calculations
   - Track costs by tax year

3. **Handle different tax treatments for different income types**
   - Apply appropriate allowances (CGT, dividend)
   - Calculate taxable amounts correctly
   - Handle loss offsetting where applicable

4. **Generate unified tax summary**
   - Combine all income types
   - Calculate total taxable income
   - Provide detailed breakdowns

### Files to Update
- `src/main/python/services/tax_year_calculator.py` - Enhance existing calculator

### Test Requirements
- Integration tests with all income types
- Tax calculation accuracy tests
- Cost basis inclusion verification
- Comprehensive tax summary tests
- Allowance calculation tests

### Acceptance Criteria
- [ ] All income types integrated into tax calculation
- [ ] Comprehensive cost basis calculations included
- [ ] Tax allowances applied correctly
- [ ] Unified tax summary generated
- [ ] Tax liability estimation provided
- [ ] All tests pass

---

## Task 4.2: Comprehensive Tax Summary Domain Model

**File:** `src/main/python/models/domain_models.py`

**Estimated Time:** 2 days

### Description
Create a comprehensive tax summary model that includes all income types and tax calculations.

### New Domain Model

```python
@dataclass
class ComprehensiveTaxSummary:
    """Comprehensive tax summary including all income types."""
    tax_year: str
    capital_gains: Optional[TaxYearSummary] = None
    dividend_income: Optional[DividendSummary] = None
    currency_gains: Optional[CurrencyGainLossSummary] = None
    total_allowable_costs: float = 0.0
    total_taxable_income: float = 0.0
    
    # Tax allowances used
    dividend_allowance_used: float = 0.0  # UK dividend allowance
    capital_gains_allowance_used: float = 0.0  # UK CGT allowance
    currency_gains_allowance_used: float = 0.0  # If applicable
    
    @property
    def total_tax_liability(self) -> float:
        """Calculate estimated total tax liability."""
        # This would include CGT, dividend tax, etc.
        # Implementation depends on current UK tax rates
        
        # Simplified calculation
        cgt_tax = (self.capital_gains.taxable_gain * 0.10) if self.capital_gains else 0.0
        dividend_tax = (self.dividend_income.taxable_dividend_income * 0.0875) if self.dividend_income else 0.0
        currency_tax = (max(0, self.currency_gains.net_gain_loss) * 0.10) if self.currency_gains else 0.0
        
        return cgt_tax + dividend_tax + currency_tax
    
    @property
    def summary_by_income_type(self) -> Dict[str, float]:
        """Get summary breakdown by income type."""
        return {
            'capital_gains': self.capital_gains.taxable_gain if self.capital_gains else 0.0,
            'dividend_income': self.dividend_income.total_net_gbp if self.dividend_income else 0.0,
            'currency_gains': max(0, self.currency_gains.net_gain_loss) if self.currency_gains else 0.0,
            'total_allowable_costs': self.total_allowable_costs
        }
    
    @property
    def has_taxable_income(self) -> bool:
        """Check if there's any taxable income."""
        return self.total_taxable_income > 0
    
    @property
    def requires_tax_return(self) -> bool:
        """Check if a tax return is likely required."""
        # Simplified logic - real implementation would consider various factors
        
        # CGT above allowance
        if self.capital_gains and self.capital_gains.taxable_gain > 0:
            return True
        
        # Dividend income above allowance
        if self.dividend_income and self.dividend_income.taxable_dividend_income > 0:
            return True
        
        # Currency gains above de minimis
        if self.currency_gains and self.currency_gains.net_gain_loss > 1000:  # £1,000 de minimis
            return True
        
        return False
    
    def get_allowances_summary(self) -> Dict[str, Dict[str, float]]:
        """Get summary of tax allowances used."""
        return {
            'capital_gains': {
                'allowance': 3000.0,  # 2024-25 rate
                'used': self.capital_gains_allowance_used,
                'remaining': max(0, 3000.0 - self.capital_gains_allowance_used)
            },
            'dividend': {
                'allowance': 500.0,  # 2024-25 rate
                'used': self.dividend_allowance_used,
                'remaining': max(0, 500.0 - self.dividend_allowance_used)
            }
        }
    
    def get_tax_efficiency_metrics(self) -> Dict[str, float]:
        """Calculate tax efficiency metrics."""
        total_income = (
            (self.capital_gains.total_gain if self.capital_gains else 0.0) +
            (self.dividend_income.total_gross_gbp if self.dividend_income else 0.0) +
            (self.currency_gains.total_gains if self.currency_gains else 0.0)
        )
        
        if total_income == 0:
            return {'effective_tax_rate': 0.0, 'allowance_utilization': 0.0}
        
        effective_tax_rate = (self.total_tax_liability / total_income) * 100
        
        # Calculate allowance utilization
        total_allowances = 3000.0 + 500.0  # CGT + Dividend allowances
        allowances_used = self.capital_gains_allowance_used + self.dividend_allowance_used
        allowance_utilization = (allowances_used / total_allowances) * 100
        
        return {
            'effective_tax_rate': effective_tax_rate,
            'allowance_utilization': allowance_utilization,
            'tax_saved_by_allowances': (allowances_used * 0.10)  # Simplified
        }
```

### Implementation Details

1. **Comprehensive model including all income types**
   - Include capital gains, dividends, currency gains
   - Track tax allowances used
   - Calculate total taxable income

2. **Tax allowance tracking**
   - UK CGT allowance (£3,000 for 2024-25)
   - UK dividend allowance (£500 for 2024-25)
   - Track usage and remaining allowances

3. **Summary calculations and breakdowns**
   - Income type breakdowns
   - Tax liability estimates
   - Tax efficiency metrics

4. **Extensible for future income types**
   - Easy to add new income types
   - Flexible allowance system
   - Configurable tax rates

### Files to Update
- `src/main/python/models/domain_models.py` - Add new model

### Test Requirements
- Unit tests for all calculations
- Tax allowance application tests
- Summary breakdown verification
- Integration with tax year calculator
- Tax efficiency metrics tests

### Acceptance Criteria
- [ ] ComprehensiveTaxSummary model created
- [ ] All income types included
- [ ] Tax allowances tracked correctly
- [ ] Summary calculations work properly
- [ ] Tax efficiency metrics calculated
- [ ] All unit tests pass

---

## Dependencies and Prerequisites

### External Dependencies
- No new external dependencies required
- Uses existing Python standard library and project dependencies

### Internal Dependencies
- **Phase 2 complete** - Dividend processing
- **Phase 3 complete** - Currency exchange processing
- Existing disposal calculator and tax year calculator
- Existing domain models

### Data Requirements
- All transaction types processed
- Tax allowance rates (configurable)
- UK tax year boundaries

---

## Testing Strategy

### Unit Tests
- Test comprehensive tax calculation logic
- Test allowance applications
- Test tax liability estimates
- Test summary calculations

### Integration Tests
- Test with all income types combined
- Test with real comprehensive data
- Test tax year boundary conditions

### Test Data Management
- Create comprehensive tax scenarios
- Include all income types in test data
- Test edge cases and boundary conditions

---

## Success Criteria

### Functional Requirements
- [ ] All income types integrated into tax calculation
- [ ] Comprehensive cost basis calculations included
- [ ] Tax allowances applied correctly
- [ ] Unified tax summaries generated
- [ ] Tax liability estimates provided

### Non-Functional Requirements
- [ ] Performance acceptable for comprehensive calculations
- [ ] Error handling comprehensive and informative
- [ ] Code coverage > 90% for new code

### Quality Requirements
- [ ] Code follows existing project patterns
- [ ] Comprehensive documentation
- [ ] All tests pass
- [ ] Integration with existing components

---

## Integration Points

### With Phases 2 & 3
- Uses dividend processor for dividend income
- Uses currency processor for FX gains/losses
- Integrates all income types seamlessly

### With Phase 5
- Provides comprehensive tax data for portfolio analytics
- Enables tax-aware performance metrics

### With Phase 6
- Provides data for comprehensive tax reports
- Enables unified tax and portfolio reporting

---

## Next Steps

After completing Phase 4, the system will have comprehensive tax calculation capabilities. This enables:

1. **Phase 6: Enhanced Reporting** - Use comprehensive tax data in reports
2. **Complete tax compliance** - Full UK tax calculation support
3. **Tax optimization insights** - Tax efficiency analysis and recommendations

The enhanced tax calculator provides the foundation for complete UK tax compliance and optimization analysis.

---

*Last Updated: 2025-06-24*
