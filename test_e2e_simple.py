#!/usr/bin/env python3
"""
Simplified Playwright E2E test using JavaScript clicks
"""
import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        
        try:
            print("=== E2E TEST: Tax Calculator ===\n")
            
            # Navigate
            print("1. Navigating to calculator...")
            await page.goto("https://cgttaxtool.uk/#/calculator")
            await page.wait_for_load_state("networkidle")
            await page.wait_for_selector(".multi-step-calculator", timeout=10000)
            print("   ✓ Calculator loaded\n")
            
            # Step 1: Income Sources
            print("2. Step 1: Income Sources")
            await page.wait_for_timeout(1000)
            # Use JavaScript to click
            await page.evaluate("document.querySelector('.multi-step-calculator button:has-text(Next)').click()")
            await page.wait_for_timeout(1000)
            print("   ✓ Clicked Next\n")
            
            # Step 2: Upload file
            print("3. Step 2: Upload File")
            file_path = "/Users/myuser/development/ibkr-tax-calculator/data/U14657426_20240408_20250404.qfx"
            await page.set_input_files('input[type="file"]', file_path)
            await page.wait_for_selector(".list-group-item", timeout=5000)
            print("   ✓ File uploaded")
            await page.wait_for_timeout(500)
            await page.evaluate("document.querySelector('.multi-step-calculator button:has-text(Next)').click()")
            await page.wait_for_timeout(1000)
            print("   ✓ Clicked Next\n")
            
            # Step 3: Personal Details
            print("4. Step 3: Personal Details")
            await page.click('input[value="england-wales-ni"]')
            await page.fill('#dateOfBirth', '1990-01-01')
            await page.wait_for_timeout(500)
            await page.evaluate("document.querySelector('.multi-step-calculator button:has-text(Next)').click()")
            await page.wait_for_timeout(1000)
            print("   ✓ Filled details and clicked Next\n")
            
            # Step 4: Review and Calculate
            print("5. Step 4: Review and Calculate")
            await page.wait_for_timeout(500)
            await page.evaluate("document.querySelector('button:has-text(Calculate Tax)').click()")
            print("   ✓ Clicked Calculate Tax\n")
            
            # Wait for results
            print("6. Waiting for results...")
            await page.wait_for_url("**/#/results", timeout=60000)
            await page.wait_for_selector(".holdings-results-table", timeout=30000)
            await page.wait_for_timeout(2000)
            print("   ✓ Results loaded\n")
            
            # Verify results
            print("7. Verifying results...")
            
            # Holdings
            holdings_count = await page.locator('.holdings-results-table tbody tr').count()
            print(f"   Holdings: {holdings_count}")
            assert holdings_count == 6, f"Expected 6 holdings, got {holdings_count}"
            
            # Disposals
            disposals_count = await page.locator('.results-disposals-table tbody tr').count()
            print(f"   Disposals: {disposals_count}")
            assert disposals_count == 3, f"Expected 3 disposals, got {disposals_count}"
            
            # Dividends
            dividends_count = await page.locator('.results-dividends-table tbody tr').count()
            print(f"   Dividends: {dividends_count}")
            assert dividends_count >= 5, f"Expected >=5 dividends, got {dividends_count}"
            
            print("\n" + "="*50)
            print("✅ ALL TESTS PASSED!")
            print("="*50)
            print(f"\n📊 Results Summary:")
            print(f"   • Portfolio Holdings: {holdings_count}/6 ✓")
            print(f"   • Disposals: {disposals_count}/3 ✓")
            print(f"   • Dividends: {dividends_count} ✓")
            
            # Take screenshot
            await page.screenshot(path="/Users/myuser/.gemini/antigravity/brain/bf59bb50-861a-4132-bda7-1737a40653c6/e2e_test_success.png", full_page=True)
            print(f"\n📸 Screenshot saved")
            
            await page.wait_for_timeout(3000)
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            await page.screenshot(path="/Users/myuser/.gemini/antigravity/brain/bf59bb50-861a-4132-bda7-1737a40653c6/e2e_test_failure.png")
            raise
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
