#!/usr/bin/env python3
"""
Simple script to complete the full tax calculation workflow
"""
import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        print("1. Navigating to calculator...")
        await page.goto("https://cgttaxtool.uk/#/calculator")
        await page.wait_for_load_state("networkidle")
        
        # Wait for wizard
        await page.wait_for_selector(".multi-step-calculator", timeout=10000)
        
        print("2. Step 1: Income Sources - clicking Next...")
        next_btn = page.locator('.multi-step-calculator button:has-text("Next")').first
        await next_btn.click()
        await page.wait_for_timeout(1000)
        
        print("3. Step 2: Uploading file...")
        file_path = "/Users/myuser/development/ibkr-tax-calculator/data/U14657426_20240408_20250404.qfx"
        await page.set_input_files('input[type="file"]', file_path)
        await page.wait_for_selector(".list-group-item", timeout=5000)
        print("   File uploaded!")
        
        await next_btn.click()
        await page.wait_for_timeout(1000)
        
        print("4. Step 3: Personal Details...")
        await page.click('input[value="england-wales-ni"]')
        await page.fill('#dateOfBirth', '1990-01-01')
        await next_btn.click()
        await page.wait_for_timeout(1000)
        
        print("5. Step 4: Review - clicking Calculate Tax...")
        calc_btn = page.locator('button:has-text("Calculate Tax")').first
        await calc_btn.click()
        
        print("6. Waiting for results...")
        await page.wait_for_url("**/#/results", timeout=60000)
        await page.wait_for_selector(".holdings-results-table", timeout=30000)
        
        print("7. Results loaded! Taking screenshots...")
        await page.screenshot(path="/Users/myuser/.gemini/antigravity/brain/bf59bb50-861a-4132-bda7-1737a40653c6/results_top.png", full_page=False)
        
        # Scroll to see more
        await page.evaluate("window.scrollTo(0, 800)")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/Users/myuser/.gemini/antigravity/brain/bf59bb50-861a-4132-bda7-1737a40653c6/results_middle.png", full_page=False)
        
        await page.evaluate("window.scrollTo(0, 1600)")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/Users/myuser/.gemini/antigravity/brain/bf59bb50-861a-4132-bda7-1737a40653c6/results_bottom.png", full_page=False)
        
        # Full page screenshot
        await page.screenshot(path="/Users/myuser/.gemini/antigravity/brain/bf59bb50-861a-4132-bda7-1737a40653c6/results_full.png", full_page=True)
        
        print("\n✅ Complete! Screenshots saved.")
        print("   - results_top.png")
        print("   - results_middle.png")
        print("   - results_bottom.png")
        print("   - results_full.png")
        
        # Keep browser open for 5 seconds so user can see
        await page.wait_for_timeout(5000)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
