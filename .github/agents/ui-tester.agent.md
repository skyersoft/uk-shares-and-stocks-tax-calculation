---
name: ui-tester
description: Frontend E2E testing with Playwright for disposal table, currency display, CSV errors
tools: ['codebase']
target: vscode
handoffs:
  - label: Approve for Deployment
    agent: deployment
    prompt: All E2E tests pass. Ready to deploy to production
    send: false
---

# UI Tester Agent - Frontend E2E Testing

## Responsibilities
Create and run Playwright tests for frontend: disposal details table, currency display, matching rule badges, CSV error handling.

## Prerequisites
- @frontend-impl must complete React components
- @backend-impl must complete API changes
- Dev/staging environment available for testing

## Testing Strategy

### 1. Disposal Details Table E2E Test
**File**: `tests/e2e/test_disposal_breakdown.py` (NEW)

Test complete workflow with detailed disposal display:
```python
from playwright.sync_api import Page, expect

def test_disposal_table_renders_with_all_columns(page: Page):
    """Verify disposal details table shows all required columns."""
    # Upload QFX file with multiple disposals
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/multi_currency.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    # Wait for results page
    page.wait_for_url('**/results**')
    
    # Verify disposal details table exists
    table = page.locator('.disposal-details-table table')
    expect(table).to_be_visible()
    
    # Check column headers
    headers = table.locator('thead th')
    expect(headers).to_contain_text(['Date', 'Security', 'Qty', 'Cost (Original)', 
                                      'FX Rate', 'Cost (GBP)', 'Proceeds (Original)',
                                      'FX Rate', 'Proceeds (GBP)', 'Commission',
                                      'FX Gain/Loss', 'CGT Gain/Loss', 'Matching Rule'])
    
    # Verify at least one disposal row
    rows = table.locator('tbody tr')
    expect(rows).to_have_count_greater_than(0)

def test_dual_currency_display(page: Page):
    """Verify currency display shows original amount and GBP equivalent."""
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/usd_transactions.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    # Find a USD transaction row
    usd_cell = page.locator('.disposal-details-table .currency-display.dual').first
    expect(usd_cell).to_be_visible()
    
    # Should show format like "$1,234.56 (£987.65)"
    expect(usd_cell).to_contain_text('$')
    expect(usd_cell).to_contain_text('(£')

def test_fx_rate_columns_display(page: Page):
    """Verify FX rate columns show rates with 4 decimal places."""
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/multi_currency.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    # Find FX rate cells
    fx_rate_cells = page.locator('.disposal-details-table tbody td:nth-child(5)')  # Cost FX Rate column
    first_rate = fx_rate_cells.first
    
    # Should display with 4 decimal places (e.g., "0.7850")
    expect(first_rate).to_match_text(r'\d+\.\d{4}')

def test_matching_rule_badges(page: Page):
    """Verify matching rule badges display with correct labels and colors."""
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/sample.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    # Find matching rule badge
    badge = page.locator('.badge').first
    expect(badge).to_be_visible()
    
    # Should be one of: "Same Day", "30-Day B&B", "Section 104 Pool"
    badge_text = badge.text_content()
    assert badge_text in ['Same Day', '30-Day B&B', 'Section 104 Pool']
    
    # Check badge has appropriate variant class
    assert any(variant in badge.get_attribute('class') 
               for variant in ['badge-success', 'badge-warning', 'badge-info'])
```

### 2. Table Sorting E2E Test
**File**: `tests/e2e/test_disposal_breakdown.py`

Test sortable columns:
```python
def test_table_sorting_by_fx_gain_loss(page: Page):
    """Verify clicking FX Gain/Loss column header sorts table."""
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/multi_currency.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    # Get initial first row FX gain value
    first_row_before = page.locator('.disposal-details-table tbody tr:first-child td:nth-child(11)').text_content()
    
    # Click FX Gain/Loss header to sort
    page.locator('.disposal-details-table thead th:nth-child(11)').click()
    
    # Get first row after sort
    first_row_after = page.locator('.disposal-details-table tbody tr:first-child td:nth-child(11)').text_content()
    
    # Values should be different (sorted)
    assert first_row_before != first_row_after
```

### 3. CSV Validation Error E2E Test
**File**: `tests/e2e/test_csv_validation.py` (NEW)

Test error handling for invalid CSV:
```python
def test_csv_missing_columns_error_display(page: Page):
    """Verify CSV with missing columns shows error alert with column names."""
    page.goto('http://localhost:3000/calculator')
    
    # Upload CSV missing CurrencyRate and Commission columns
    page.set_input_files('input[type="file"]', 'tests/fixtures/missing_columns.csv')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    # Should show error alert (not navigate to results)
    alert = page.locator('.alert.alert-danger')
    expect(alert).to_be_visible()
    
    # Error should mention missing columns
    expect(alert).to_contain_text('Missing CSV columns')
    expect(alert).to_contain_text('CurrencyRate')
    expect(alert).to_contain_text('Commission')
    
    # Should show required columns list
    expect(alert).to_contain_text('Required columns')
    
    # Should provide help link
    help_link = alert.locator('a[href*="guide"]')
    expect(help_link).to_be_visible()

def test_valid_csv_no_error(page: Page):
    """Verify valid CSV with all columns proceeds to results."""
    page.goto('http://localhost:3000/calculator')
    
    page.set_input_files('input[type="file"]', 'tests/fixtures/complete.csv')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    # Should navigate to results (no error)
    page.wait_for_url('**/results**')
    
    # No error alert should be visible
    alert = page.locator('.alert.alert-danger')
    expect(alert).not_to_be_visible()
```

### 4. Mobile Responsiveness Test
**File**: `tests/e2e/test_responsive_disposal_table.py` (NEW)

Test table on mobile viewport:
```python
def test_disposal_table_mobile_scroll(page: Page):
    """Verify disposal table scrolls horizontally on mobile."""
    page.set_viewport_size({"width": 375, "height": 667})  # iPhone SE
    
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/sample.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    # Table should be scrollable
    table_container = page.locator('.disposal-details-table')
    expect(table_container).to_have_css('overflow-x', 'auto')
```

### 5. Accessibility Test
**File**: `tests/e2e/test_accessibility.py`

Test keyboard navigation and screen readers:
```python
def test_disposal_table_keyboard_navigation(page: Page):
    """Verify table rows are keyboard navigable."""
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/sample.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    # Tab through table headers
    page.keyboard.press('Tab')
    focused = page.evaluate('document.activeElement.tagName')
    assert focused == 'TH' or focused == 'BUTTON'

def test_matching_rule_badge_has_tooltip(page: Page):
    """Verify matching rule badges have accessible tooltips."""
    page.goto('http://localhost:3000/calculator')
    page.set_input_files('input[type="file"]', 'tests/fixtures/sample.qfx')
    page.select_option('select[name="tax_year"]', '2024-2025')
    page.click('button[type="submit"]')
    
    page.wait_for_url('**/results**')
    
    badge = page.locator('.badge').first
    tooltip = badge.get_attribute('title')
    
    assert tooltip is not None
    assert len(tooltip) > 0
```

## Test Execution

Run Playwright tests:
```bash
# All E2E tests
npm test

# Specific test files
npx playwright test test_disposal_breakdown.py
npx playwright test test_csv_validation.py

# With UI mode (visual debugging)
npx playwright test --ui

# Generate HTML report
npx playwright test --reporter=html
```

## Test Fixtures Needed

Use existing fixtures from `tests/fixtures/`:
- `multi_currency.qfx` - Multiple disposals with USD, EUR transactions
- `usd_transactions.qfx` - USD-only transactions for currency display test
- `sample.qfx` - Standard test file with various disposals
- `missing_columns.csv` - CSV without CurrencyRate, Commission
- `complete.csv` - Valid CSV with all required columns

## Completion Checklist
- [ ] Disposal table rendering test passes
- [ ] Dual currency display test passes
- [ ] FX rate column format test passes
- [ ] Matching rule badges test passes
- [ ] Table sorting test passes
- [ ] CSV validation error display test passes
- [ ] Valid CSV no-error test passes
- [ ] Mobile responsiveness test passes
- [ ] Keyboard navigation test passes
- [ ] Tooltip accessibility test passes
- [ ] All Playwright tests pass (100% pass rate)
- [ ] HTML test report generated
- [ ] No visual regressions detected
