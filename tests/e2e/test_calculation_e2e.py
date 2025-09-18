import os
import pytest
from playwright.sync_api import sync_playwright, expect

# Define the base URL for the application
BASE_URL = "https://cgttaxtool.uk"

# Define the path to the test data file
TEST_DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/U14657426_20240408_20250404.qfx"))

@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Set to False to see the browser UI
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def page(browser):
    page = browser.new_page()
    yield page
    page.close()

def test_calculation_flow(page):
    print(f"Navigating to {BASE_URL}/calculate.html")
    page.goto(f"{BASE_URL}/calculate.html")
    print(f"Current URL: {page.url}")
    expect(page).to_have_title("Calculator - IBKR Tax Calculator")
    print("Successfully navigated to the calculator page.")

    # Check for API health check errors in console
    console_messages = []
    page.on("console", lambda msg: console_messages.append(msg.text))
    
    # Upload the file
    print(f"Attempting to upload file: {TEST_DATA_FILE}")
    file_input = page.locator("input[type=file]")
    file_input.set_input_files(TEST_DATA_FILE)
    print(f"File {os.path.basename(TEST_DATA_FILE)} selected for upload.")

    # Click the calculate button
    print("Clicking 'Calculate Tax & Portfolio' button.")
    calculate_button = page.locator("button#calculateBtn")
    calculate_button.click()
    print("Calculate button clicked. Waiting for results page.")

    try:
        page.wait_for_url(f"{BASE_URL}/results.html*", timeout=30000) # Wait up to 30 seconds for navigation
        print(f"Navigated to results page: {page.url}")
    except Exception as e:
        print(f"Navigation to results.html failed or timed out: {e}")
        print("All console messages:")
        for msg in console_messages:
            print(msg)
        pytest.fail("Navigation to results.html failed or timed out.")

    # Verify elements on the results page
    print("Verifying elements on the results page.")
    expect(page.locator("#totalTaxLiability")).to_be_visible()
    expect(page.locator("#portfolioValue")).to_be_visible()
    expect(page.locator("#totalReturn")).to_be_visible()
    
    print("Results page loaded successfully and key metrics are visible.")
    
    # Optional: Print some of the displayed values for debugging
    print(f"Total Tax Liability: {page.locator('#totalTaxLiability').text_content()}")
    print(f"Portfolio Value: {page.locator('#portfolioValue').text_content()}")
    print(f"Total Return: {page.locator('#totalReturn').text_content()}")

    print("Test completed successfully.")
