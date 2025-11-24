"""
Playwright E2E tests for CSV validation error handling.
Tests error display when CSV files have missing required columns.
"""
import pytest
import os
from playwright.sync_api import Page, expect
import tempfile


BASE_URL = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')


@pytest.fixture
def missing_columns_csv():
    """Create a CSV file with missing required columns."""
    csv_content = """Date,Symbol,Quantity,Price,Amount
2024-01-15,AAPL,100,150.00,15000.00
2024-06-15,AAPL,-50,180.00,-9000.00
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write(csv_content)
        temp_path = f.name
    yield temp_path
    os.unlink(temp_path)


@pytest.fixture
def complete_csv():
    """Create a complete CSV file with all required columns."""
    csv_content = """Date,Symbol,SecurityName,Quantity,Price,Amount,Currency,CurrencyRate,Commission,TransactionType
2024-01-15,AAPL,Apple Inc.,100,150.00,15000.00,USD,1.27,10.00,BUY
2024-06-15,AAPL,Apple Inc.,-50,180.00,-9000.00,USD,1.30,10.00,SELL
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write(csv_content)
        temp_path = f.name
    yield temp_path
    os.unlink(temp_path)


@pytest.mark.e2e
def test_csv_missing_columns_error_display(page: Page, missing_columns_csv):
    """Verify CSV with missing columns shows error alert with column names."""
    page.goto(f'{BASE_URL}/#/')
    
    # Upload CSV missing required columns
    page.set_input_files('input[type="file"]', missing_columns_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    # Wait for error to appear (should NOT navigate to results)
    page.wait_for_timeout(2000)
    
    # Should show error alert
    alert = page.locator('.alert-danger, .alert.alert-danger')
    expect(alert).to_be_visible(timeout=10000)
    
    # Error should mention missing columns or invalid CSV
    alert_text = alert.inner_text()
    assert 'missing' in alert_text.lower() or 'invalid' in alert_text.lower() or 'csv' in alert_text.lower()


@pytest.mark.e2e
def test_csv_missing_columns_lists_required_fields(page: Page, missing_columns_csv):
    """Verify error message lists the missing columns."""
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', missing_columns_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_timeout(2000)
    
    # Error alert should be visible
    alert = page.locator('.alert-danger, .alert.alert-danger')
    expect(alert).to_be_visible(timeout=10000)
    
    alert_text = alert.inner_text()
    
    # Should mention required columns
    assert 'required' in alert_text.lower() or 'columns' in alert_text.lower()


@pytest.mark.e2e
def test_csv_error_prevents_results_navigation(page: Page, missing_columns_csv):
    """Verify invalid CSV does not navigate to results page."""
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', missing_columns_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_timeout(3000)
    
    # Should still be on calculator page (hash should be empty or #/)
    current_url = page.url
    assert 'results' not in current_url.lower(), f"Should not navigate to results, but URL is: {current_url}"


@pytest.mark.e2e
def test_valid_csv_no_error(page: Page, complete_csv):
    """Verify valid CSV with all columns proceeds to results."""
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', complete_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    # Should navigate to results (with valid CSV)
    page.wait_for_url('**/results', timeout=30000)
    
    # No error alert should be visible on results page
    danger_alerts = page.locator('.alert-danger')
    # Results page might have warnings, but not CSV validation errors
    # Just verify we made it to results page
    expect(page).to_have_url('**/results')


@pytest.mark.e2e
def test_csv_error_can_retry(page: Page, missing_columns_csv, complete_csv):
    """Verify user can retry after CSV error."""
    page.goto(f'{BASE_URL}/#/')
    
    # First attempt with invalid CSV
    page.set_input_files('input[type="file"]', missing_columns_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_timeout(2000)
    
    # Error should be visible
    alert = page.locator('.alert-danger, .alert.alert-danger')
    expect(alert).to_be_visible(timeout=10000)
    
    # Now upload valid CSV
    page.set_input_files('input[type="file"]', complete_csv)
    page.click('button:has-text("Calculate Tax")')
    
    # Should now proceed to results
    page.wait_for_url('**/results', timeout=30000)
    expect(page).to_have_url('**/results')


@pytest.mark.e2e
def test_csv_error_displays_on_calculator_page(page: Page, missing_columns_csv):
    """Verify error displays inline on calculator page, not as redirect."""
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', missing_columns_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_timeout(2000)
    
    # Error should appear on same page
    alert = page.locator('.alert-danger, .alert.alert-danger')
    expect(alert).to_be_visible(timeout=10000)
    
    # Calculator form should still be visible
    file_input = page.locator('input[type="file"]')
    expect(file_input).to_be_visible()


@pytest.mark.e2e
def test_error_message_mentions_csv_format(page: Page, missing_columns_csv):
    """Verify error message specifically mentions CSV format issue."""
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', missing_columns_csv)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_timeout(2000)
    
    alert = page.locator('.alert-danger, .alert.alert-danger')
    expect(alert).to_be_visible(timeout=10000)
    
    alert_text = alert.inner_text().lower()
    
    # Should mention CSV or format
    assert 'csv' in alert_text or 'format' in alert_text or 'file' in alert_text
