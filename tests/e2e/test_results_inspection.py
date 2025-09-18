import os
import json
import time
import pytest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = "https://cgttaxtool.uk"
TEST_DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/U11075163_202409_202409.qfx"))

@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def page(browser):
    page = browser.new_page()
    console_messages = []
    page.on("console", lambda msg: console_messages.append({"type": msg.type, "text": msg.text}))
    page._collected_console = console_messages  # attach for later
    yield page
    page.close()

RESULT_SELECTORS = {
    "metrics": [
        "#totalTaxLiability", "#portfolioValue", "#totalReturn"
    ],
    "tables": {
        "disposals": {"count": "#disposals-count", "body": "#disposals-table-body", "expected_min_cols": 6},
        "dividends": {"count": "#dividends-count", "body": "#dividends-table-body", "expected_min_cols": 5},
        "portfolio": {"count": "#portfolio-count", "body": "#portfolio-table-body", "expected_min_cols": 6},
    }
}

def extract_table(page, body_selector):
    rows = page.locator(f"{body_selector} tr")
    row_count = rows.count()
    extracted = []
    for i in range(row_count):
        row = rows.nth(i)
        cells = row.locator("td")
        cell_count = cells.count()
        extracted.append([cells.nth(j).inner_text().strip() for j in range(cell_count)])
    return extracted

@pytest.mark.e2e
def test_results_page_field_population(page):
    assert os.path.exists(TEST_DATA_FILE), f"Missing test data file: {TEST_DATA_FILE}"

    # Step 1: Navigate to calculator and upload file
    page.goto(f"{BASE_URL}/calculate.html")
    expect(page).to_have_title("Calculator - IBKR Tax Calculator")
    file_input = page.locator("input[type=file]")
    file_input.set_input_files(TEST_DATA_FILE)

    # Submit calculation
    page.locator("button#calculateBtn").click()

    # Wait for results navigation
    page.wait_for_url(f"{BASE_URL}/results.html*", timeout=60000)

    # Wait for content to render (loading indicator hidden, metrics visible)
    expect(page.locator("#resultsContent")).to_be_visible(timeout=30000)

    # Collect metric values
    metrics = {sel: page.locator(sel).inner_text().strip() for sel in RESULT_SELECTORS["metrics"]}

    # Collect tables
    table_data = {}
    for name, cfg in RESULT_SELECTORS["tables"].items():
        count_text = page.locator(cfg["count"]).inner_text().strip()
        try:
            count_val = int(count_text)
        except ValueError:
            count_val = -1
        rows = extract_table(page, cfg["body"])
        table_data[name] = {
            "reported_count": count_val,
            "actual_row_count": len(rows),
            "sample_rows": rows[:5]
        }

    # Export collected info to artifact file (local)
    out_dir = Path("tests/e2e/artifacts")
    out_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = out_dir / "results_page_inspection.json"
    payload = {
        "metrics": metrics,
        "tables": table_data,
        "console": page._collected_console,
        "timestamp": time.time(),
        "test_file": os.path.basename(TEST_DATA_FILE)
    }
    artifact_path.write_text(json.dumps(payload, indent=2))

    # Basic assertions (do not enforce counts yet, just presence)
    for sel, val in metrics.items():
        assert val != "", f"Metric {sel} is empty"

    # Ensure portfolio table row structure if any rows
    portfolio_rows = table_data["portfolio"]["sample_rows"]
    if portfolio_rows and portfolio_rows[0][0] == "N/A":
        # Soft warning: ticker missing
        print("WARNING: Portfolio first row symbol rendered as N/A")

    # Print summary for debugging
    print("Collected Metrics:", json.dumps(metrics, indent=2))
    print("Table Summary:")
    for name, info in table_data.items():
        print(f"  {name}: reported={info['reported_count']} actual={info['actual_row_count']}")
        if info['sample_rows']:
            print(f"    sample: {info['sample_rows'][0]}")
    if page._collected_console:
        print("Console messages (first 10):")
        for msg in page._collected_console[:10]:
            print(msg)

    # Always pass for now; diagnostic test
    assert True
