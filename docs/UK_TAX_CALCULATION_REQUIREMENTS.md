# UK Tax Calculation Requirements

## Overview

This document outlines the comprehensive UK tax calculation requirements for the IBKR Tax Calculator, based on current HMRC guidance and gov.uk sources.

## 1. Capital Gains Tax (CGT)

### 1.1 Tax Rates (2024-2025 and 2025-2026)

**From 6 April 2025 onwards:**
- **Basic Rate Taxpayers**: 18% on gains from all chargeable assets
- **Higher/Additional Rate Taxpayers**: 24% on gains from all chargeable assets
- **Carried Interest**: 32% (for investment fund managers)

**For 2024-2025 tax year:**
- Basic Rate: 10% on gains from shares/securities, 18% on residential property
- Higher Rate: 20% on gains from shares/securities, 24% on residential property

### 1.2 Annual Exempt Amount (Tax-Free Allowance)

- **2024-2025**: £3,000
- **2025-2026**: £3,000
- **Trusts**: £1,500

### 1.3 Share Matching Rules (HMRC CG51560)

**Priority Order:**
1. **Same Day Rule**: Disposals matched with acquisitions on the same day
2. **Bed & Breakfast Rule**: Disposals matched with acquisitions within 30 days after disposal
3. **Section 104 Pool**: All other shares pooled with average cost basis

**Implementation Requirements:**
- Same day matching takes absolute priority
- 30-day rule prevents bed & breakfast tax avoidance
- Section 104 pool maintains running average cost
- Must track acquisition dates for matching rules

### 1.4 Allowable Costs

**Included in cost basis:**
- Purchase price of shares
- Broker commissions and fees
- Stamp duty (where applicable)
- Currency conversion costs

**Excluded:**
- Interest on loans to buy shares
- Ongoing management fees

## 2. Dividend Tax

### 2.1 Dividend Allowance

- **2024-2025**: £500
- **2023-2024**: £1,000
- **2022-2023**: £2,000

### 2.2 Dividend Tax Rates (Above Allowance)

- **Basic Rate**: 8.75%
- **Higher Rate**: 33.75%
- **Additional Rate**: 39.35%

### 2.3 Tax Band Calculation

1. Add dividend income to other taxable income
2. Apply Personal Allowance (£12,570 for 2024-2025)
3. Determine tax band based on total taxable income
4. Apply dividend allowance to reduce taxable dividends
5. Apply appropriate dividend tax rate

### 2.4 Foreign Dividends

- Subject to same rates as UK dividends
- Withholding tax may be creditable against UK tax
- Must convert to GBP using exchange rate on payment date

## 3. Foreign Exchange (FX) Treatment

### 3.1 Currency Conversion Rules

**For Capital Gains:**
- Acquisition cost: Convert using exchange rate on purchase date
- Disposal proceeds: Convert using exchange rate on sale date
- FX gains/losses on the underlying investment are part of the capital gain

**For Dividends:**
- Convert using exchange rate on payment date
- Withholding tax converted at same rate

### 3.2 FX Gains/Losses on Currency Holdings

- Generally not subject to CGT for individuals
- Business context may create taxable FX gains/losses
- Small amounts may be exempt under de minimis rules

## 4. Implementation Requirements

### 4.1 Data Requirements

**For each transaction:**
- Transaction date and settlement date
- Security identifier (ISIN, CUSIP, etc.)
- Transaction type (BUY, SELL, DIVIDEND)
- Quantity and price
- Currency and exchange rate
- Commissions and fees
- Withholding tax (for dividends)

### 4.2 Calculation Engine Requirements

**Share Pool Management:**
- Maintain Section 104 pools per security
- Track acquisition dates for matching rules
- Calculate average cost basis
- Handle corporate actions (splits, mergers)

**Tax Year Processing:**
- UK tax year: 6 April to 5 April
- Separate calculations per tax year
- Carry forward losses between years

**Currency Handling:**
- Store original currency amounts
- Apply exchange rates at transaction dates
- Handle multiple currencies in portfolio

### 4.3 Reporting Requirements

**Capital Gains Report:**
- Disposal date, security, quantity
- Proceeds and cost basis (in GBP)
- Gain/loss and matching rule used
- Annual summary with exemption applied

**Dividend Report:**
- Payment date, security, amount
- Gross and net amounts (in GBP)
- Withholding tax details
- Annual summary with allowance applied

**Tax Summary:**
- Total taxable gains/losses
- Total dividend income
- Allowances used
- Tax liability by type

## 5. Validation Rules

### 5.1 Data Validation

- Dates must be valid and in correct format
- Quantities must be positive for purchases, negative for sales
- Prices and amounts must be positive
- Currency codes must be valid ISO codes
- Exchange rates must be positive

### 5.2 Business Logic Validation

- Cannot sell more shares than owned
- Disposal dates must be after acquisition dates
- Tax year must be valid UK tax year format
- Matching rules must be applied in correct priority order

## 6. Error Handling

### 6.1 Data Errors

- Missing required fields
- Invalid data formats
- Inconsistent transaction data
- Missing exchange rates

### 6.2 Calculation Errors

- Insufficient shares for disposal
- Invalid tax year
- Negative cost basis (after adjustments)
- Currency conversion failures

## 7. Compliance Notes

### 7.1 HMRC Requirements

- Calculations must follow HMRC guidance exactly
- All amounts rounded to 2 decimal places (pence)
- Dates in UK format where required
- Proper handling of leap years

### 7.2 Audit Trail

- Maintain detailed calculation logs
- Store intermediate calculation steps
- Enable reconstruction of any calculation
- Track data sources and assumptions

## 8. Future Considerations

### 8.1 Regulatory Changes

- Monitor HMRC guidance updates
- Track annual rate and allowance changes
- Implement new rules as they come into effect

### 8.2 Enhanced Features

- Support for additional asset classes
- Integration with HMRC APIs
- Automated exchange rate feeds
- Multi-year tax planning

---

*Last Updated: 2025-01-09*
*Sources: gov.uk, HMRC Capital Gains Manual, HMRC Business Income Manual*
