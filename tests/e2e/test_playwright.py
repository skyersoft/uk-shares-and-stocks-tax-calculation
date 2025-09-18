#!/usr/bin/env python3
"""
Playwright end-to-end test to verify the tax calculator workflow
Tests both portfolio holdings and disposal table functionality
"""

import asyncio
import os
import sys
import pytest
from playwright.async_api import async_playwright


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_tax_calculator_workflow():
    """Test the complete tax calculator workflow with Playwright"""
    base_url = os.getenv('E2E_BASE_URL', 'https://cgttaxtool.uk')
    headless = os.getenv('CI') is not None  # Run headless in CI
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[BROWSER] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda error: print(f"[ERROR] {error}"))
        
        try:
            print("=== PLAYWRIGHT TAX CALCULATOR TEST ===")
            
            # Step 1: Navigate to calculator page
            print("1. Navigating to calculator page...")
            await page.goto(f"{base_url}/calculate.html")
            await page.wait_for_load_state("networkidle")
            
            # Step 2: Check if page loaded correctly
            title = await page.title()
            print(f"   Page title: {title}")
            assert "Calculator" in title, f"Expected 'Calculator' in title, got: {title}"
            
            # Step 3: Upload test file
            test_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "U14657426_20240408_20250404.qfx")
            if not os.path.exists(test_file):
                pytest.skip(f"Test file not found: {test_file}")
                
            print(f"2. Uploading test file: {os.path.basename(test_file)} ({os.path.getsize(test_file)} bytes)")
            file_input = page.locator('input[type="file"]')
            await file_input.set_input_files(test_file)
            
            # Wait for file processing and UI update
            await page.wait_for_timeout(3000)
            
            # Verify file was uploaded by checking if upload area changed
            upload_area = page.locator('label[for="fileInput"]')
            upload_text = await upload_area.text_content()
            print(f"   Upload area text: {upload_text[:100]}...")
            
            # Wait for calculate button to be enabled
            calculate_button = page.locator('#calculateBtn')
            await calculate_button.wait_for(state="visible", timeout=10000)
            is_disabled = await calculate_button.is_disabled()
            print(f"   Calculate button disabled: {is_disabled}")
            
            # Step 4: Select tax year (should already be 2024-2025)
            print("3. Selecting tax year...")
            tax_year_select = page.locator('select[name="tax_year"]')
            await tax_year_select.select_option("2024-2025")
            
            # Step 5: Submit form and wait for results
            print("4. Submitting calculation...")
            
            # Wait for button to be clickable
            if is_disabled:
                print("   Waiting for calculate button to be enabled...")
                await page.wait_for_function("() => !document.getElementById('calculateBtn').disabled", timeout=10000)
            
            await calculate_button.click()
            
            # Wait for results page
            print("5. Waiting for results page...")
            await page.wait_for_url("**/results.html*", timeout=30000)
            await page.wait_for_timeout(5000)  # Give time for JS to execute
            
            # Step 6: Verify portfolio holdings table
            print("6. Verifying portfolio holdings...")
            portfolio_table = page.locator('#portfolio-table-body')
            await portfolio_table.wait_for(timeout=10000)
            
            # Count portfolio holdings
            portfolio_rows = portfolio_table.locator('tr')
            portfolio_count = await portfolio_rows.count()
            print(f"   Portfolio holdings found: {portfolio_count}")
            
            # Verify we have the expected 6 holdings
            assert portfolio_count == 6, f"Expected 6 portfolio holdings, got {portfolio_count}"
            
            # Check that symbols are populated (not empty)
            symbols = []
            for i in range(portfolio_count):
                row = portfolio_rows.nth(i)
                symbol_cell = row.locator('td').nth(0)  # Symbol is typically first column
                symbol_text = await symbol_cell.text_content()
                symbols.append(symbol_text.strip())
                print(f"   Portfolio {i}: {symbol_text.strip()}")
            
            # Verify symbols are not empty
            empty_symbols = [s for s in symbols if not s or s == 'N/A']
            assert len(empty_symbols) == 0, f"Found {len(empty_symbols)} empty symbols in portfolio: {empty_symbols}"
            
            # Verify expected symbols are present
            expected_symbols = {'ASM', 'ASML', 'RR.', 'BSX', 'NVDA', 'TSLA'}
            found_symbols = set(symbols)
            assert expected_symbols.issubset(found_symbols), f"Missing symbols. Expected: {expected_symbols}, Found: {found_symbols}"
            
            # Step 7: Verify disposals table
            print("7. Verifying disposals table...")
            disposals_table = page.locator('#disposals-table-body')
            await disposals_table.wait_for(timeout=10000)
            
            # Count disposal rows
            disposal_rows = disposals_table.locator('tr')
            disposal_count = await disposal_rows.count()
            print(f"   Disposal rows found: {disposal_count}")
            
            # Verify we have the expected 3 disposals
            assert disposal_count == 3, f"Expected 3 disposals, got {disposal_count}"
            
            # Check disposal symbols
            disposal_symbols = []
            for i in range(disposal_count):
                row = disposal_rows.nth(i)
                symbol_cell = row.locator('td').nth(1)  # Symbol is typically second column in disposals
                symbol_text = await symbol_cell.text_content()
                disposal_symbols.append(symbol_text.strip())
                
                # Also get date and quantity for verification
                date_cell = row.locator('td').nth(0)
                quantity_cell = row.locator('td').nth(2)
                date_text = await date_cell.text_content()
                quantity_text = await quantity_cell.text_content()
                
                print(f"   Disposal {i}: {symbol_text.strip()} - {quantity_text.strip()} shares on {date_text.strip()}")
            
            # Verify disposal symbols are not empty
            empty_disposal_symbols = [s for s in disposal_symbols if not s or s == 'N/A']
            assert len(empty_disposal_symbols) == 0, f"Found {len(empty_disposal_symbols)} empty disposal symbols: {empty_disposal_symbols}"
            
            # Verify expected disposal symbols
            expected_disposal_symbols = {'RR.', 'NXE', 'AMZN'}
            found_disposal_symbols = set(disposal_symbols)
            assert expected_disposal_symbols.issubset(found_disposal_symbols), f"Missing disposal symbols. Expected: {expected_disposal_symbols}, Found: {found_disposal_symbols}"
            
            # Step 8: Verify dividends table  
            print("8. Verifying dividends table...")
            dividends_table = page.locator('#dividends-table-body')
            await dividends_table.wait_for(timeout=10000)
            
            dividend_rows = dividends_table.locator('tr')
            dividend_count = await dividend_rows.count()
            print(f"   Dividend rows found: {dividend_count}")
            
            # Verify we have dividends (should be 7)
            assert dividend_count >= 5, f"Expected at least 5 dividends, got {dividend_count}"
            
            # Check first few dividend symbols
            for i in range(min(3, dividend_count)):
                row = dividend_rows.nth(i)
                symbol_cell = row.locator('td').nth(1)  # Symbol column
                symbol_text = await symbol_cell.text_content()
                print(f"   Dividend {i}: {symbol_text.strip()}")
            
            # Step 9: Verify summary statistics
            print("9. Verifying summary statistics...")
            
            # Check disposals count
            disposals_count_elem = page.locator('#disposals-count')
            if await disposals_count_elem.count() > 0:
                disposals_count_text = await disposals_count_elem.text_content()
                print(f"   Disposals count: {disposals_count_text}")
                assert disposals_count_text == "3", f"Expected disposals count '3', got '{disposals_count_text}'"
            
            # Check dividends count  
            dividends_count_elem = page.locator('#dividends-count')
            if await dividends_count_elem.count() > 0:
                dividends_count_text = await dividends_count_elem.text_content()
                print(f"   Dividends count: {dividends_count_text}")
            
            print("\n=== TEST RESULTS ===")
            print(f"✅ Portfolio holdings: {portfolio_count}/6")
            print(f"✅ Portfolio symbols populated: {len(found_symbols)}/{len(expected_symbols)}")
            print(f"✅ Disposals: {disposal_count}/3") 
            print(f"✅ Disposal symbols populated: {len(found_disposal_symbols)}/{len(expected_disposal_symbols)}")
            print(f"✅ Dividends: {dividend_count} (expected ≥5)")
            print("\n🎉 ALL TESTS PASSED! The duplicate file fix is working correctly.")
            
            # Take a screenshot for verification
            screenshot_path = os.path.join(os.path.dirname(__file__), "..", "responses", "test_results_screenshot.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved as {screenshot_path}")
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            # Take screenshot of failure
            failure_screenshot_path = os.path.join(os.path.dirname(__file__), "..", "responses", "test_failure_screenshot.png")
            await page.screenshot(path=failure_screenshot_path, full_page=True)
            print(f"📸 Failure screenshot saved as {failure_screenshot_path}")
            raise
            
        finally:
            await browser.close()


# Remove main execution - this is now a pytest function