#!/usr/bin/env python3
"""
Playwright end-to-end test to verify the tax calculator workflow (SPA version)
Tests the multi-step wizard and results generation
"""

import asyncio
import os
import sys
import pytest
from playwright.async_api import async_playwright


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_tax_calculator_spa_workflow():
    """Test the complete tax calculator workflow with Playwright (SPA)"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('HEADLESS', 'true').lower() == 'true'
    
    # Ensure base_url doesn't have trailing slash
    if base_url.endswith('/'):
        base_url = base_url[:-1]
        
    calculator_url = f"{base_url}/#/calculator"
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[BROWSER] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda error: print(f"[ERROR] {error}"))
        
        try:
            print("=== PLAYWRIGHT TAX CALCULATOR SPA TEST ===")
            
            # Step 1: Navigate to calculator page
            print(f"1. Navigating to calculator page: {calculator_url}")
            await page.goto(calculator_url)
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(2000)  # Give React time to render
            
            # Wait for the wizard to load
            await page.wait_for_selector(".multi-step-calculator", timeout=10000)
            print("   Wizard loaded")
            
            # Step 1: Income Sources (Wizard Step 1)
            print("2. Wizard Step 1: Income Sources - clicking Next...")
            # Verify Investment Portfolio is selected (default)
            # We just click Next as defaults are correct for this test
            # Use a more specific selector to avoid strict mode violations
            next_button = page.locator('.multi-step-calculator button:has-text("Next")').first
            await next_button.wait_for(state="visible", timeout=5000)
            await page.wait_for_timeout(500)
            await next_button.click()
            await page.wait_for_timeout(1000)
            
            # Step 2: Upload Details (Wizard Step 2)
            print("3. Wizard Step 2: Upload Details")
            
            # Upload test file
            test_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "U14657426_20240408_20250404.qfx")
            if not os.path.exists(test_file):
                pytest.skip(f"Test file not found: {test_file}")
                
            print(f"   Uploading test file: {os.path.basename(test_file)}")
            file_input = page.locator('input[type="file"]')
            await file_input.set_input_files(test_file)
            
            # Wait for file to appear in list
            await page.wait_for_selector(".list-group-item", timeout=5000)
            print("   File uploaded successfully")
            await page.wait_for_timeout(500)
            
            # Click Next
            await next_button.click()
            await page.wait_for_timeout(1000)
            
            # Step 3: Personal Details (Wizard Step 3)
            print("4. Wizard Step 3: Personal Details")
            
            # Select Tax Residency (England/Wales/NI)
            await page.click('input[value="england-wales-ni"]')
            await page.wait_for_timeout(300)
            
            # Enter Date of Birth
            await page.fill('#dateOfBirth', '1990-01-01')
            await page.wait_for_timeout(300)
            
            # Click Next
            await next_button.click()
            await page.wait_for_timeout(1000)
            
            # Step 4: Review (Wizard Step 4)
            print("5. Wizard Step 4: Review - clicking Calculate Tax...")
            
            # Click Calculate Tax
            calculate_button = page.locator('button:has-text("Calculate Tax")').first
            await calculate_button.wait_for(state="visible", timeout=5000)
            await calculate_button.click()
            
            # Wait for results page
            print("6. Waiting for results...")
            # The URL should change to /#/results
            await page.wait_for_url("**/#/results", timeout=60000)
            print("   URL changed to results page")
            
            # Wait for results to load (look for holdings table)
            await page.wait_for_selector(".holdings-results-table", timeout=30000)
            print("   Holdings table loaded")
            await page.wait_for_timeout(2000)  # Let all tables render
            
            # Step 7: Verify portfolio holdings table
            print("7. Verifying portfolio holdings...")
            portfolio_table = page.locator('.holdings-results-table tbody')
            
            # Count portfolio holdings
            portfolio_rows = portfolio_table.locator('tr')
            portfolio_count = await portfolio_rows.count()
            print(f"   Portfolio holdings found: {portfolio_count}")
            
            # Verify we have the expected 6 holdings
            assert portfolio_count == 6, f"Expected 6 portfolio holdings, got {portfolio_count}"
            
            # Check that symbols are populated
            symbols = []
            for i in range(portfolio_count):
                row = portfolio_rows.nth(i)
                # Symbol is usually the first column
                symbol_cell = row.locator('td').nth(0)
                symbol_text = await symbol_cell.text_content()
                symbols.append(symbol_text.strip())
                print(f"   Portfolio {i}: {symbol_text.strip()}")
            
            expected_symbols = {'ASM', 'ASML', 'RR.', 'BSX', 'NVDA', 'TSLA'}
            found_symbols = set(symbols)
            assert expected_symbols.issubset(found_symbols), f"Missing symbols. Expected: {expected_symbols}, Found: {found_symbols}"
            
            # Step 8: Verify disposals table
            print("8. Verifying disposals table...")
            disposals_table = page.locator('.results-disposals-table tbody')
            
            # Count disposal rows
            disposal_rows = disposals_table.locator('tr')
            disposal_count = await disposal_rows.count()
            print(f"   Disposal rows found: {disposal_count}")
            
            # Verify we have the expected 3 disposals
            assert disposal_count == 3, f"Expected 3 disposals, got {disposal_count}"
            
            # Step 9: Verify dividends table
            print("9. Verifying dividends table...")
            dividends_table = page.locator('.results-dividends-table tbody')
            
            dividend_rows = dividends_table.locator('tr')
            dividend_count = await dividend_rows.count()
            print(f"   Dividend rows found: {dividend_count}")
            
            # Verify we have dividends (should be >= 5)
            assert dividend_count >= 5, f"Expected at least 5 dividends, got {dividend_count}"
            
            print("\n=== TEST RESULTS ===")
            print(f"✅ Portfolio holdings: {portfolio_count}/6")
            print(f"✅ Disposals: {disposal_count}/3") 
            print(f"✅ Dividends: {dividend_count} (expected ≥5)")
            print("\n🎉 ALL TESTS PASSED!")
            
            # Take a screenshot for verification
            screenshot_path = os.path.join(os.path.dirname(__file__), "..", "responses", "spa_test_results_screenshot.png")
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved as {screenshot_path}")
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            # Take screenshot of failure
            failure_screenshot_path = os.path.join(os.path.dirname(__file__), "..", "responses", "spa_test_failure_screenshot.png")
            os.makedirs(os.path.dirname(failure_screenshot_path), exist_ok=True)
            await page.screenshot(path=failure_screenshot_path, full_page=True)
            print(f"📸 Failure screenshot saved as {failure_screenshot_path}")
            raise
            
        finally:
            await browser.close()
