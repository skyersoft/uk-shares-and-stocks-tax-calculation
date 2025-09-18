import os
import json
import pytest
from playwright.sync_api import sync_playwright, expect

BASE_URL = "https://cgttaxtool.uk"
TEST_DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/U11075163_202409_202409.qfx"))
API_RESPONSE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../response.json"))

@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def page(browser):
    page = browser.new_page()
    yield page
    page.close()

@pytest.fixture(scope="module")
def api_response():
    with open(API_RESPONSE_FILE) as f:
        return json.load(f)

def perform_calculation(page):
    page.goto(f"{BASE_URL}/calculate.html")
    expect(page).to_have_title("Calculator - IBKR Tax Calculator")
    page.on("console", lambda msg: print(f"[browser console] {msg.type}: {msg.text}"))
    
    file_input = page.locator("input[type=file]")
    file_input.set_input_files(TEST_DATA_FILE)
    
    page.locator("button#calculateBtn").click()
    
    page.wait_for_url(f"{BASE_URL}/results.html*", timeout=30000)

def test_results_page_verification(page, api_response):
    perform_calculation(page)

    expect(page.locator('#loadingIndicator')).to_be_hidden(timeout=20000)
    expect(page.locator('#resultsHeader')).to_be_visible()
    expect(page.locator('#resultsContent')).to_be_visible()

    # Verify Tax Report Summary
    tax_report = api_response['tax_report']
    expect(page.locator('#totalTaxLiability')).to_have_text(f"£{tax_report['summary']['total_taxable_income']:.2f}")
    
    # Verify Portfolio Summary
    portfolio_report = api_response['portfolio_report']
    expect(page.locator('#portfolioValue')).to_have_text(f"£{portfolio_report['grand_total']['total_value']:.2f}")
    expect(page.locator('#totalReturn')).to_have_text(f"{portfolio_report['grand_total']['total_return_pct']:.2f}%")

    # Verify Capital Gains
    cgt_report = tax_report['capital_gains']
    expect(page.locator('#cgt-total-gain')).to_have_text(f"£{cgt_report['total_gain']:.2f}")
    expect(page.locator('#cgt-allowance-used')).to_have_text(f"£{cgt_report['allowance_used']:.2f}")
    expect(page.locator('#cgt-taxable-gain')).to_have_text(f"£{cgt_report['taxable_gain']:.2f}")

    # Verify Dividend Income
    dividend_report = tax_report['dividend_income']
    expect(page.locator('#dividend-total-gross')).to_have_text(f"£{dividend_report['total_gross']:.2f}")
    expect(page.locator('#dividend-total-net')).to_have_text(f"£{dividend_report['total_net']:.2f}")
    expect(page.locator('#dividend-allowance-used')).to_have_text(f"£{dividend_report['allowance_used']:.2f}")
    expect(page.locator('#dividend-taxable-income')).to_have_text(f"£{dividend_report['taxable_income']:.2f}")
    expect(page.locator('#dividend-withholding-tax')).to_have_text(f"£{dividend_report['withholding_tax']:.2f}")

    # Verify Holdings Table
    holdings = portfolio_report['markets']['UNKNOWN']['holdings']
    expect(page.locator('#portfolio-count')).to_have_text(str(len(holdings)))
    
    for i, holding in enumerate(holdings):
        row = page.locator(f'#portfolio-table-body tr').nth(i)
        expect(row.locator('td').nth(0)).to_have_text(holding['symbol'])
        expect(row.locator('td').nth(1)).to_have_text(holding['name'])
        expect(row.locator('td').nth(2)).to_have_text(str(holding['quantity']))
        expect(row.locator('td').nth(3)).to_have_text(f"£{holding['price']:.2f}")
        expect(row.locator('td').nth(4)).to_have_text(f"£{holding['value']:.2f}")
        expect(row.locator('td').nth(5)).to_have_text(f"{holding['total_return_pct']:.2f}%")
