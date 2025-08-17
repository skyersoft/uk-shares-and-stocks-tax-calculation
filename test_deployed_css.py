#!/usr/bin/env python3
"""Test deployed results page with CSS class-specific selectors"""
import asyncio
from playwright.async_api import async_playwright
import json

# Mock data matching our test structure
mock_data = {
    "tax_year": "2024",
    "disposals": [
        {"disposal_date": "2024-01-15", "symbol": "AAPL", "quantity": 50, "proceeds": 8500, "cost": 7000, "gain_loss": 1500},
        {"disposal_date": "2024-02-20", "symbol": "MSFT", "quantity": 30, "proceeds": 9000, "cost": 8200, "gain_loss": 800},
        {"disposal_date": "2024-03-10", "symbol": "GOOGL", "quantity": 20, "proceeds": 12000, "cost": 11000, "gain_loss": 1000}
    ],
    "dividends": [
        {"payment_date": "2024-01-15", "symbol": "AAPL", "dividend_amount": 150, "tax_withheld": 15},
        {"payment_date": "2024-02-15", "symbol": "MSFT", "dividend_amount": 200, "tax_withheld": 20}
    ],
    "top_holdings": [
        {"symbol": "NVDA", "quantity": 100, "average_cost": 250, "current_value": 35000, "unrealized_gain_loss": 10000, "total_cost": 25000},
        {"symbol": "AMD", "quantity": 200, "average_cost": 120, "current_value": 28000, "unrealized_gain_loss": 4000, "total_cost": 24000}
    ],
    "portfolio_report": {
        "market_summaries": {
            "NASDAQ": {
                "number_of_holdings": 5,
                "total_value": 50000,
                "weight_in_portfolio": 60.0,
                "total_cost": 45000,
                "total_unrealized_gain_loss": 5000
            },
            "NYSE": {
                "number_of_holdings": 3,
                "total_value": 33000,
                "weight_in_portfolio": 40.0,
                "total_cost": 30000,
                "total_unrealized_gain_loss": 3000
            }
        }
    }
}

async def test_deployed_css_classes():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Load the deployed results page
        await page.goto('https://cgttaxtool.uk/results.html')
        await page.wait_for_load_state('networkidle')
        
        # Inject mock data with the correct key
        await page.evaluate(f"""
            sessionStorage.setItem('calculationResults', JSON.stringify({json.dumps(mock_data)}));
        """)
        
        # Reload to load the data
        await page.reload()
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(2000)  # Wait for content generation
        
        print("🌐 Testing deployed results page with CSS class selectors...")
        print("🔗 URL: https://cgttaxtool.uk/results.html")
        
        # Test specific CSS class selectors
        disposal_tables = await page.locator('table.disposal-table').count()
        dividend_tables = await page.locator('table.dividend-table').count()
        market_tables = await page.locator('table.market-table').count()
        holdings_tables = await page.locator('table.holdings-table').count()
        
        print(f"\n📊 TABLE COUNTS BY CSS CLASS:")
        print(f"   disposal-table: {disposal_tables}")
        print(f"   dividend-table: {dividend_tables}")
        print(f"   market-table: {market_tables}")
        print(f"   holdings-table: {holdings_tables}")
        
        # Check headers for each table type
        if disposal_tables > 0:
            disposal_headers = await page.locator('table.disposal-table thead th').count()
            disposal_rows = await page.locator('table.disposal-table tbody tr').count()
            print(f"   ✅ Disposal: {disposal_headers} headers, {disposal_rows} rows")
        else:
            print(f"   ❌ No disposal tables found")
            
        if dividend_tables > 0:
            dividend_headers = await page.locator('table.dividend-table thead th').count()
            dividend_rows = await page.locator('table.dividend-table tbody tr').count()
            print(f"   ✅ Dividend: {dividend_headers} headers, {dividend_rows} rows")
        else:
            print(f"   ❌ No dividend tables found")
            
        if market_tables > 0:
            market_headers = await page.locator('table.market-table thead th').count()
            market_rows = await page.locator('table.market-table tbody tr').count()
            print(f"   ✅ Market: {market_headers} headers, {market_rows} rows")
        else:
            print(f"   ❌ No market tables found")
            
        if holdings_tables > 0:
            holdings_headers = await page.locator('table.holdings-table thead th').count()
            holdings_rows = await page.locator('table.holdings-table tbody tr').count()
            print(f"   ✅ Holdings: {holdings_headers} headers, {holdings_rows} rows")
        else:
            print(f"   ❌ No holdings tables found")
        
        # Check if there are any unclassified tables
        all_tables = await page.locator('table').count()
        classified_tables = disposal_tables + dividend_tables + market_tables + holdings_tables
        print(f"\n📈 TOTAL TABLES: {all_tables} (classified: {classified_tables})")
        
        if all_tables > classified_tables:
            print(f"   ⚠️  {all_tables - classified_tables} unclassified tables detected")
        
        # Take a screenshot
        await page.screenshot(path='deployed_css_test.png', full_page=True)
        print("\n📸 Screenshot saved as 'deployed_css_test.png'")
        
        await browser.close()
        
        # Return results for verification
        return {
            "disposal_tables": disposal_tables,
            "dividend_tables": dividend_tables,
            "market_tables": market_tables,
            "holdings_tables": holdings_tables,
            "total_tables": all_tables
        }

if __name__ == "__main__":
    results = asyncio.run(test_deployed_css_classes())
    print(f"\n🎯 FINAL RESULTS: {results}")
