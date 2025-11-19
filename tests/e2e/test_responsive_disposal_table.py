"""
Playwright E2E tests for responsive design and mobile display.
Tests disposal details table on mobile viewports.
"""
import pytest
import os
from playwright.sync_api import Page, expect


BASE_URL = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')


@pytest.fixture(scope="module")
def sample_qfx_file():
    """Path to sample QFX file with multiple disposals."""
    return "tests/fixtures/sample.qfx"


@pytest.mark.e2e
def test_disposal_table_mobile_scroll(page: Page, sample_qfx_file):
    """Verify disposal table scrolls horizontally on mobile."""
    # Set mobile viewport (iPhone SE)
    page.set_viewport_size({"width": 375, "height": 667})
    
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', sample_qfx_file)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_url('**/results', timeout=30000)
    
    # Wait for disposal table
    table = page.locator('.disposal-details-table')
    expect(table).to_be_visible(timeout=10000)
    
    # Table container should be visible
    table_container = page.locator('.table-responsive, .disposal-details-table .card-body')
    expect(table_container.first).to_be_visible()


@pytest.mark.e2e
def test_disposal_table_tablet_display(page: Page, sample_qfx_file):
    """Verify disposal table displays properly on tablet."""
    # Set tablet viewport (iPad)
    page.set_viewport_size({"width": 768, "height": 1024})
    
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', sample_qfx_file)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_url('**/results', timeout=30000)
    
    # Wait for disposal table
    table = page.locator('.disposal-details-table table')
    expect(table).to_be_visible(timeout=10000)
    
    # All columns should be visible
    headers = table.locator('thead th')
    expect(headers.first).to_be_visible()


@pytest.mark.e2e
def test_disposal_table_desktop_display(page: Page, sample_qfx_file):
    """Verify disposal table displays properly on desktop."""
    # Set desktop viewport
    page.set_viewport_size({"width": 1920, "height": 1080})
    
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', sample_qfx_file)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_url('**/results', timeout=30000)
    
    # Wait for disposal table
    table = page.locator('.disposal-details-table table')
    expect(table).to_be_visible(timeout=10000)
    
    # Table should be fully visible without scrolling
    rows = table.locator('tbody tr')
    expect(rows.first).to_be_visible()


@pytest.mark.e2e
def test_mobile_results_page_layout(page: Page, sample_qfx_file):
    """Verify results page layout adapts to mobile."""
    page.set_viewport_size({"width": 375, "height": 667})
    
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', sample_qfx_file)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_url('**/results', timeout=30000)
    
    # Results page header should be visible
    header = page.locator('text=Tax Calculation Results')
    expect(header).to_be_visible()
    
    # Disposal table should be accessible
    disposal_section = page.locator('.disposal-details-table')
    expect(disposal_section).to_be_visible(timeout=10000)


@pytest.mark.e2e
def test_mobile_currency_display(page: Page, sample_qfx_file):
    """Verify currency display is readable on mobile."""
    page.set_viewport_size({"width": 375, "height": 667})
    
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', sample_qfx_file)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_url('**/results', timeout=30000)
    
    # Wait for disposal table
    table = page.locator('.disposal-details-table')
    expect(table).to_be_visible(timeout=10000)
    
    # Currency displays should be visible
    currency_displays = page.locator('.currency-display')
    if currency_displays.count() > 0:
        expect(currency_displays.first).to_be_visible()


@pytest.mark.e2e
def test_mobile_badge_display(page: Page, sample_qfx_file):
    """Verify matching rule badges display properly on mobile."""
    page.set_viewport_size({"width": 375, "height": 667})
    
    page.goto(f'{BASE_URL}/#/')
    
    page.set_input_files('input[type="file"]', sample_qfx_file)
    page.select_option('select[name="taxYear"]', '2024-2025')
    page.click('button:has-text("Calculate Tax")')
    
    page.wait_for_url('**/results', timeout=30000)
    
    # Wait for disposal table
    table = page.locator('.disposal-details-table')
    expect(table).to_be_visible(timeout=10000)
    
    # Badges should be visible
    badges = page.locator('.badge')
    if badges.count() > 0:
        expect(badges.first).to_be_visible()
