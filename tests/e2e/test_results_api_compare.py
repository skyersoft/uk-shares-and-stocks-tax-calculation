import os
import json
import time
import pytest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import subprocess

BASE_URL = "https://cgttaxtool.uk"
TEST_DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/U11075163_202409_202409.qfx"))
API_CALC_URL = f"{BASE_URL}/prod/calculate"

@pytest.fixture(scope="module")
def api_payload():
    assert os.path.exists(TEST_DATA_FILE)
    # Call API directly via curl for parity with UI
    cmd = [
        "curl","-s","-X","POST", API_CALC_URL,
        "-F", f"file=@{TEST_DATA_FILE}",
        "-F", "tax_year=2024-2025",
        "-F", "analysis_type=both"
    ]
    raw = subprocess.check_output(cmd)
    data = json.loads(raw)
    return data

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

@pytest.mark.e2e
def test_ui_matches_api_for_holdings(api_payload, page):
    # Extract expected holdings summary from API
    api_holdings = []
    ms = api_payload.get("portfolio_analysis", {}).get("market_summaries", {})
    for market in ms.values():
        for h in market.get("holdings", []) :
            api_holdings.append({
                "symbol": h.get("security", {}).get("symbol"),
                "quantity": h.get("quantity"),
                "avg_cost": h.get("average_cost_gbp"),
                "current_value": h.get("current_value_gbp"),
                "unrealized": h.get("unrealized_gain_loss"),
                "total_return_pct": h.get("total_return_pct")
            })

    assert len(api_holdings) > 0, "API returned no holdings; test cannot proceed"

    # Drive UI
    page.goto(f"{BASE_URL}/calculate.html")
    expect(page).to_have_title("Calculator - IBKR Tax Calculator")
    page.locator("input[type=file]").set_input_files(TEST_DATA_FILE)
    page.locator("button#calculateBtn").click()
    page.wait_for_url(f"{BASE_URL}/results.html*", timeout=60000)
    expect(page.locator("#portfolio-table-body")).to_be_visible()

    # Collect UI holdings rows
    rows = page.locator("#portfolio-table-body tr")
    ui_rows = []
    for i in range(rows.count()):
        cells = rows.nth(i).locator("td")
        cell_text = [cells.nth(j).inner_text().strip() for j in range(cells.count())]
        if len(cell_text) == 6 and cell_text[0] != "No portfolio holdings found":
            ui_rows.append(cell_text)

    assert len(ui_rows) == len(api_holdings), f"UI rows {len(ui_rows)} != API holdings {len(api_holdings)} (pre-fix expectation may fail)"

    # Map and compare symbol presence only for now (expected failing if symbol missing)
    ui_symbols = [r[0] for r in ui_rows]
    api_symbols = [h['symbol'] for h in api_holdings]

    # Soft checks: at least one symbol should match; collect mismatches
    intersections = set(ui_symbols) & set(api_symbols)
    if not intersections:
        pytest.fail(f"No matching symbols between UI {ui_symbols} and API {api_symbols}")

    # TODO (after fix): add numeric value assertions with normalization (strip £, commas, %)
    assert True
